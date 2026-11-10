import { fromHtml } from 'hast-util-from-html';
import { toText } from 'hast-util-to-text';
import type { Root, RootContent, Element } from 'hast';
import snapshot from '../content/oscp-nstsec.snapshot.json' with { type: 'json' };
import type { SearchPage, SearchSection } from './nstsec-search';

export function prepareSearchPage(page: { title: string; url: string; html: string }, track: string) {
  let option = 0;
  const html = page.html.replace(/<details\b([^>]*)>/g, (tag, attributes: string) => {
    option++;
    return /\bid=/.test(attributes) ? tag : `<details id="note-option-${option}"${attributes}>`;
  });
  const sections: SearchSection[] = [{ label: 'Page introduction', anchor: '', text: page.title + ' ', headingLength: page.title.length + 1 }];
  let current = sections[0];
  let headings: { level: number; title: string }[] = [];
  function visit(node: Root | RootContent) {
    if (node.type === 'text') { current.text += node.value; return; }
    if (node.type === 'element') {
      const tag = node.tagName;
      if (tag === 'h1') return;
      if (/^h[2-6]$/.test(tag)) {
        const title = toText(node).trim(), level = Number(tag[1]);
        headings = headings.filter(heading => heading.level < level);
        headings.push({ level, title });
        current = { label: headings.slice(-2).map(heading => heading.title).join(' › '), anchor: String(node.properties.id || ''), text: title + ' ', headingLength: title.replace(/\s+/g, ' ').length + 1 };
        sections.push(current); return;
      }
      if (tag === 'details') {
        const saved = current, previousHeadings = [...headings];
        const summary = node.children.find((child): child is Element => child.type === 'element' && child.tagName === 'summary');
        const title = summary ? toText(summary).trim() : 'Alternative';
        current = { label: title, anchor: String(node.properties.id || ''), text: title + ' ', headingLength: title.replace(/\s+/g, ' ').length + 1 };
        sections.push(current);
        for (const child of node.children) if (child !== summary) visit(child);
        current = saved; headings = previousHeadings; return;
      }
    }
    if ('children' in node) for (const child of node.children) visit(child);
    if (node.type === 'element' && /^(p|pre|li|ul|ol|tr|td|th|table|blockquote|div|br|dl|dt|dd)$/.test(node.tagName)) current.text += ' ';
  }
  visit(fromHtml(html, { fragment: true }));
  for (const section of sections) section.text = section.text.replace(/\s+/g, ' ').trim();
  return { html, index: { title: page.title, url: page.url, track, sections: sections.filter(section => section.text) } satisfies SearchPage };
}

let track = '';
export const preparedNotes = new Map(snapshot.pages.map(page => {
  if (!page.depth) track = page.title;
  return [page.url, prepareSearchPage(page, track)] as const;
}));
export const searchPages = [...preparedNotes.values()].map(page => page.index);
