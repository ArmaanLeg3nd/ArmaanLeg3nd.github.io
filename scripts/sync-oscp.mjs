import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/sync-oscp.mjs <public strategy-map.v1.json>');
const data = JSON.parse(await readFile(source, 'utf8'));
if (data.schemaVersion !== 1 || !data.contentHash || !Array.isArray(data.methods)) throw new Error('Unsupported strategy snapshot');
const ids = new Set(data.methods.map(m => m.id));
if (ids.size !== data.methods.length) throw new Error('Duplicate method IDs');
for (const m of data.methods) {
  if (!m.recognition || !m.procedure || m.next.some(edge => !ids.has(edge.id) || !edge.when || !edge.requires)) throw new Error(`Incomplete method ${m.id}`);
}
await writeFile(fileURLToPath(new URL('../src/content/oscp.snapshot.json', import.meta.url)), JSON.stringify(data) + '\n');
console.log(`Pinned ${ids.size} methods from ${data.sourceRevision}; ${data.contentHash.slice(0,12)}`);
