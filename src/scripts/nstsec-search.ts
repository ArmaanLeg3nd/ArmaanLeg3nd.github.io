import { searchNotes, occurrences } from '../lib/nstsec-search';
import type { SearchPage } from '../lib/nstsec-search';

const input = document.querySelector<HTMLInputElement>('#find')!;
const results = document.querySelector<HTMLDivElement>('#results')!;
const status = document.querySelector<HTMLDivElement>('#search-status')!;
const pages: SearchPage[] = JSON.parse(document.querySelector('#notes-search-data')?.textContent || '[]');
function highlighted(text: string, query: string) {
  const fragment = document.createDocumentFragment();
  let cursor = 0;
  for (const position of occurrences(text, query)) {
    fragment.append(document.createTextNode(text.slice(cursor, position)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(position, position + query.length);
    fragment.append(mark); cursor = position + query.length;
  }
  fragment.append(document.createTextNode(text.slice(cursor)));
  return fragment;
}
function update() {
  const found = searchNotes(pages, input.value);
  results.replaceChildren(); results.hidden = !found.query;
  input.setAttribute('aria-expanded', String(!!found.query));
  if (!found.query) { status.textContent = ''; return; }
  const description = found.pages
    ? `${found.matches} match${found.matches === 1 ? '' : 'es'} in ${found.pages} page${found.pages === 1 ? '' : 's'}${found.pages > found.results.length ? ` · showing ${found.results.length}` : ''}`
    : 'No matches. Try a tool name, command option or shorter phrase.';
  const summary = document.createElement('p'); summary.className = 'search-summary'; summary.textContent = description;
  results.append(summary); status.textContent = description;
  for (const result of found.results) {
    const card = document.createElement('div'); card.className = 'search-result';
    const top = document.createElement('div'); top.className = 'search-result-top';
    const title = document.createElement('a'); title.className = 'search-result-title';
    title.href = result.previews[0]?.url || result.page.url;
    title.append(highlighted(result.page.title, found.query));
    const count = document.createElement('span'); count.className = 'search-count';
    count.textContent = `${result.count} match${result.count === 1 ? '' : 'es'}`;
    top.append(title, count); card.append(top);
    if (result.page.track !== result.page.title) {
      const track = document.createElement('span'); track.className = 'search-track'; track.textContent = result.page.track; card.append(track);
    }
    for (const preview of result.previews) {
      const link = document.createElement('a'); link.className = 'search-occurrence'; link.href = preview.url;
      const label = document.createElement('span'); label.className = 'search-section'; label.textContent = preview.label;
      const snippet = document.createElement('span'); snippet.className = 'search-excerpt'; snippet.append(highlighted(preview.text, found.query));
      link.append(label, snippet); card.append(link);
    }
    results.append(card);
  }
}
function clear() { input.value = ''; update(); input.focus(); }
input.addEventListener('input', update);
input.addEventListener('keydown', event => {
  if (event.key === 'Escape') clear();
  if (event.key === 'ArrowDown') { const first = results.querySelector<HTMLAnchorElement>('a'); if (first) { event.preventDefault(); first.focus(); } }
  if (event.key === 'Enter' && !event.isComposing) results.querySelector<HTMLAnchorElement>('a')?.click();
});
results.addEventListener('keydown', event => {
  if (event.key === 'Escape') { clear(); return; }
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  const links = [...results.querySelectorAll<HTMLAnchorElement>('a')], current = links.indexOf(document.activeElement as HTMLAnchorElement);
  if (current < 0) return;
  event.preventDefault(); const next = current + (event.key === 'ArrowDown' ? 1 : -1);
  if (next < 0) input.focus(); else links[Math.min(next, links.length - 1)].focus();
});
function revealSection() {
  let id: string; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  if (!id) return;
  const target = document.getElementById(id); if (!target) return;
  for (let element: HTMLElement | null = target; element; element = element.parentElement) if (element instanceof HTMLDetailsElement) element.open = true;
  requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}
window.addEventListener('hashchange', revealSection);
results.addEventListener('click', event => {
  const link = (event.target as HTMLElement).closest('a');
  if (link && new URL(link.href).pathname === location.pathname) setTimeout(revealSection, 0);
});
revealSection();
const browser = document.querySelector<HTMLDetailsElement>('#track-browser')!, narrow = matchMedia('(max-width: 760px)');
browser.open = !narrow.matches; narrow.addEventListener('change', event => browser.open = !event.matches);
