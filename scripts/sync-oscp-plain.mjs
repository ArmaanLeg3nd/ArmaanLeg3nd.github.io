// Pin only tracked public reference documents. The normal build needs no private vault.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/sync-oscp-plain.mjs <public-reference-checkout>');
const root = fileURLToPath(new URL('../',import.meta.url));
const repo = resolve(source);
const git = (...args) => execFileSync('git',['-C',repo,...args],{encoding:'utf8'}).trim();
const tracked = git('ls-files','-z').split('\0').filter(Boolean);
const paths = tracked.filter(path => path === 'README.md' || /^(notes|reference|cheatsheets)\/.*\.md$/.test(path));
const pages = [];
const sections = JSON.parse(await readFile(resolve(repo,'notes/ad-investigation/sections.json'),'utf8'));
const learning = JSON.parse(await readFile(resolve(repo,'notes/ad-investigation/learning.json'),'utf8'));
for (const path of paths) {
  const markdown = (await readFile(resolve(repo,path),'utf8')).replace(/\r\n/g,'\n');
  const title = markdown.match(/^# (.+)$/m)?.[1];
  if (!title) throw new Error('Missing document title: '+path);
  const slug = path === 'README.md' ? '' : path.replace(/(?:^|\/)README\.md$/, '').replace(/\.md$/,'');
  pages.push({path,slug,title,markdown});
}
const routes = new Set(pages.map(page=>page.slug));
if (routes.size !== pages.length) throw new Error('Duplicate plain reference route');
const assets = tracked.filter(path=>/^diagrams\/.*\.(svg|png)$/.test(path)||/^mindmaps\/(?:surfaces|tracks)\/.*\.canvas$/.test(path)||path==='mindmaps/START.canvas'||path==='OSCP-Attack-Surface-Atlas.zip');
for (const asset of assets) {
  const target = resolve(root,'public/oscp',asset);
  await mkdir(dirname(target),{recursive:true});
  await writeFile(target,await readFile(resolve(repo,asset)));
}
const contentHash = createHash('sha256').update(JSON.stringify(pages)).digest('hex');
await writeFile(resolve(root,'src/content/oscp-plain.snapshot.json'),JSON.stringify({
  schemaVersion:1, sections, learning, sourceRevision:git('rev-parse','HEAD'),contentHash,assets,pages
})+'\n');
console.log('Pinned '+pages.length+' plain documents and '+assets.length+' diagram assets; '+contentHash.slice(0,12));
