import snapshot from '../content/oscp.snapshot.json';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import type { Catalog, Method, MethodSummary } from './oscp-types';
import { combinedProcedure, procedureNotes } from './oscp-procedure';
import { buildSearchText } from './oscp-search';

export const catalog: Catalog = {
  schemaVersion: snapshot.schemaVersion, contentHash: snapshot.contentHash, sourceRevision: snapshot.sourceRevision,
  stages: snapshot.stages, topics: snapshot.topics, chains: snapshot.chains,
  methods: snapshot.methods.map(m => ({ id: m.id, topic: m.topic, title: m.title, family: m.family, clue: m.clue, access: m.access, conditions: m.conditions,
    search: buildSearchText(m) }))
};
const cache = new Map<string, Promise<Method[]>>();
// Content is an allowlisted, reviewed repository snapshot, never user-supplied Markdown.
const processor = createMarkdownProcessor({ syntaxHighlight: false, smartypants: false });
async function render(markdown: string) {
  const html = (await (await processor).render(markdown)).code;
  // Check real tags only: escaped payload examples may contain literal "onerror=" text.
  if (/<(?:script|iframe|object|embed|style|form|input)\b|<[^>]+\son\w+\s*=|<[^>]+(?:href|src)=["']\s*(?:javascript|data):/i.test(html)) throw new Error('Unsafe strategy markup');
  return html.replace(/<pre([^>]*)>/g, '<pre$1><button type="button" data-copy aria-label="Copy command">Copy</button>');
}
export function topicMethods(id: string): Promise<Method[]> {
  if (!cache.has(id)) cache.set(id, Promise.all(snapshot.methods.filter(m => m.topic === id).map(async m => {
    const baseline = m.procedure.split(/<details\b/i)[0];
    return { ...m, search: catalog.methods.find(x => x.id === m.id)!.search,
      html: { checks: await render(m.checks), discovery: await render(m.recognition.commands), procedure: await render(combinedProcedure(m.procedure,true)), notes: await render(procedureNotes(m.procedure)), baseline: await render(baseline) } };
  })));
  return cache.get(id)!;
}
export const findSummary = (id: string): MethodSummary | undefined => catalog.methods.find(m => m.id === id);
