import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const snapshot=JSON.parse(readFileSync(new URL('src/content/oscp-nstsec.snapshot.json',root),'utf8'));
test('adapted track pages and all local destinations exist in the built site',()=>{
 assert.equal(snapshot.pages.length,43);
 assert.equal(snapshot.pages.filter(p=>!p.depth&&p.path!=='tools.md').length,8);
 const missing=new Set();
 for(const p of snapshot.pages){
  const file=new URL('dist'+p.url+'index.html',root);
  assert.ok(existsSync(file),p.url);
  const html=readFileSync(file,'utf8');
  assert.ok(html.includes('aria-label="Tracks"')&&html.includes('NSTSec / Astaruf'),p.url);
  assert.equal((html.match(/<section>/g)||[]).length,8,p.url+': visible track groups');
  assert.ok(!html.includes('{%'),p.url+': unrendered GitBook directive');
  for(const match of html.matchAll(/(?:href|src)="([^"#]+)[^"]*"/g)){
   const target=match[1].split('#')[0];if(!target.startsWith('/'))continue;
   const path=decodeURIComponent(target.split('?')[0]);
   const destination=new URL('dist'+path+(path.endsWith('/')?'index.html':''),root);
   if(!existsSync(destination))missing.add(p.url+' -> '+path);
  }
 }
 assert.deepEqual([...missing],[]);
});
test('tool index links each catalogued tool to its source notes and resolves fragments',()=>{
 assert.ok(snapshot.tools.length>25&&snapshot.tools.length<70);
 for(const name of ['Nmap and NSE','curl','GNU coreutils','Hydra','PowerShell and built-in cmdlets','linPEAS','winPEAS','PowerView','Mimikatz'])assert.ok(!snapshot.tools.some(t=>t.name===name),name+': stock tool should be omitted');
 for(const name of ['Seatbelt','SharpUp','nmapAutomator','Linux Smart Enumeration','Rubeus'])assert.ok(snapshot.tools.some(t=>t.name===name),name+': extra should be included');
 const index=snapshot.pages.find(p=>p.path==='tools.md');
 assert.ok(index);
 assert.ok(index.html.includes('What to obtain')&&index.html.includes('Network Scan')&&index.html.includes('Active Directory'));
 for(const tool of snapshot.tools){
  assert.ok(index.html.includes(tool.url.replaceAll('&','&amp;')),tool.name+': upstream link');
  assert.ok(tool.mentions.length,tool.name+': no owning page');
  for(const mention of tool.mentions){
   const [url,fragment]=mention.url.split('#');
   const page=snapshot.pages.find(p=>p.url===url);
   assert.ok(page,tool.name+': receiving page');
   if(fragment)assert.ok(page.html.includes('id="'+fragment+'"'),tool.name+': section fragment');
  }
 }
});
test('the reference entry redirects to the adapted collection',()=>{
 assert.ok(readFileSync(new URL('dist/oscp/index.html',root),'utf8').includes('/oscp/nstsec/'));
 assert.ok(existsSync(new URL('dist/oscp/reference/INDEX/index.html',root)));
});
test('site entry points make the new notes primary',()=>{
 const home=readFileSync(new URL('dist/index.html',root),'utf8');
 const projects=readFileSync(new URL('dist/projects/index.html',root),'utf8');
 const tools=JSON.parse(readFileSync(new URL('src/content/tools.json',root),'utf8'));
 assert.ok(home.includes('href="/oscp/"'));
 assert.ok(projects.includes('Open notes')&&projects.includes('href="/oscp/"'));
 assert.equal(tools[0].href,'/oscp/');
 assert.equal(tools[0].title,'OSCP notes');
 const page=readFileSync(new URL('dist/oscp/nstsec/index.html',root),'utf8');
 assert.ok(page.includes('id="track-browser"')&&page.includes('class="skip-link"'));
});
