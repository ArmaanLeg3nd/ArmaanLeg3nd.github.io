export type SearchSection = { label: string; anchor: string; text: string; headingLength?: number };
export type SearchPage = { title: string; url: string; track: string; sections: SearchSection[] };
export type SearchPreview = { label: string; url: string; text: string; start: number; end: number };
export type SearchResult = { page: SearchPage; count: number; previews: SearchPreview[]; titleMatch: boolean };

export function occurrences(text: string, query: string): number[] {
  const positions: number[] = [];
  if (!query) return positions;
  const haystack = text.toLowerCase(), needle = query.toLowerCase();
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + needle.length)) positions.push(i);
  return positions;
}

export function excerpt(text: string, at: number, length: number, radius = 72) {
  let start = Math.max(0, at - radius), end = Math.min(text.length, at + length + radius);
  // Keep the exact match intact; trim surrounding context at a nearby word boundary.
  if (start) { const boundary = text.indexOf(' ', start); if (boundary >= 0 && boundary < at) start = boundary + 1; }
  if (end < text.length) { const boundary = text.lastIndexOf(' ', end); if (boundary > at + length) end = boundary; }
  return { text: (start ? '… ' : '') + text.slice(start, end) + (end < text.length ? ' …' : ''), start, end };
}

export function searchNotes(pages: SearchPage[], input: string, limit = 8) {
  const query = input.trim().replace(/\s+/g, ' ');
  if (!query) return { query, results: [] as SearchResult[], pages: 0, matches: 0 };
  const found: SearchResult[] = [];
  for (const page of pages) {
    let count = 0;
    const hits = page.sections.map(section => ({ section, positions: occurrences(section.text, query) })).filter(hit => hit.positions.length);
    const previews: SearchPreview[] = [];
    count = hits.reduce((sum, hit) => sum + hit.positions.length, 0);
    const bodyHits = hits.filter(hit => hit.section.text !== hit.section.label.split(' › ').at(-1) && hit.section.text !== page.title);
    const previewHits = [...(bodyHits.length ? bodyHits : hits)].sort((a, b) => Number(occurrences(b.section.label, query).length > 0) - Number(occurrences(a.section.label, query).length > 0) || Number(!a.section.anchor) - Number(!b.section.anchor));
    for (const { section, positions } of previewHits) {
      if (previews.length < 2) {
        const at = positions.find(position => position >= (section.headingLength || 0)) ?? positions[0];
        const offset = at >= (section.headingLength || 0) ? (section.headingLength || 0) : 0;
        const sample = excerpt(section.text.slice(offset), at - offset, query.length);
        previews.push({ label: section.label, url: page.url + (section.anchor ? '#' + encodeURIComponent(section.anchor) : ''), ...sample, start: sample.start + offset, end: sample.end + offset });
      }
    }
    // One long section may contain distinct relevant occurrences far apart.
    if (previewHits.length === 1 && previews.length === 1) {
      const hit = previewHits[0], next = hit.positions.find(position => position >= previews[0].end);
      if (next !== undefined) previews.push({ label: hit.section.label, url: previews[0].url, ...excerpt(hit.section.text, next, query.length) });
    }
    if (count) found.push({ page, count, previews, titleMatch: occurrences(page.title, query).length > 0 });
  }
  found.sort((a, b) => Number(b.titleMatch) - Number(a.titleMatch));
  return { query, results: found.slice(0, limit), pages: found.length, matches: found.reduce((total, result) => total + result.count, 0) };
}
export function serializeSearchIndex(pages: SearchPage[]) {
  // JSON lives inside a raw-text HTML script element; escape every opening bracket.
  return JSON.stringify(pages).replaceAll('<', String.fromCharCode(92) + 'u003c');
}
