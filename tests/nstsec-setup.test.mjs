import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {collectToolSetups,renderToolSetupPage} from '../src/lib/nstsec-tool-setup.mjs';
const snapshot=JSON.parse(readFileSync(new URL('../src/content/oscp-nstsec.snapshot.json',import.meta.url),'utf8'));
const plain=html=>html.replace(/<[^>]*>/g,'').replaceAll('&quot;','"').replaceAll('&#x26;','&').replaceAll('&amp;','&').replaceAll('&#x3C;','<').replaceAll('&lt;','<').replaceAll('&gt;','>');
const blocks=html=>[...html.matchAll(/<pre\b[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)].map(m=>plain(m[1]).trim());
test('every indexed tool has one canonical setup and the utility preserves its setup/check commands',()=>{
 const utility=snapshot.pages.find(p=>p.path==='tools.md');const found=new Map();
 for(const page of snapshot.pages.filter(p=>!['tools.md','public-exploit-finder.md'].includes(p.path))){
  for(const match of page.html.matchAll(/<!-- tool-setup (\{[^\n]+\}) -->\s*([\s\S]*?)<!-- \/tool-setup -->/g)){
   const meta=JSON.parse(match[1]);assert.ok(!found.has(meta.name),meta.name);found.set(meta.name,meta);
   const anchor=match[2].match(/id="(setup-[^"]+)"/)[1];assert.ok(utility.html.includes(page.url+'#'+anchor));
   const tool=snapshot.tools.find(t=>t.name===meta.name);
   const usage=tool.mentions.find(m=>m.url.split('#')[0]===page.url)?.url||page.url;
   assert.ok(utility.html.includes('href="'+usage+'">Use '+meta.name.replaceAll('&','&amp;')));
   const utilityText=plain(utility.html);
   for(const code of blocks(match[2]))for(const line of code.split('\n').filter(Boolean)){
    if(meta.tier==='baseline'&&line.startsWith('sudo apt install '))continue;
    assert.ok(utilityText.includes(line),meta.name+': lost command '+line);
   }
  }
 }
 assert.deepEqual([...found.keys()].sort(),snapshot.tools.map(t=>t.name).sort());
 for(const id of ['1-prepare-the-workspace','2-install-tools-used-on-kali','3-prepare-tools-delivered-to-targets','4-optional-tools-and-configuration','5-verify-preparation'])assert.ok(utility.html.includes('id="'+id+'"'));
 const optional=plain(utility.html).split('4. Optional tools and configuration')[0];
 assert.ok(!optional.includes('sudo systemctl start docker'));
 assert.ok(!optional.includes('MSBuild.exe'));
 assert.ok(!utility.html.includes('<!-- baseline-'));
});
test('setup collection fails closed on missing, duplicate, unknown or unsafe package entries',()=>{
 const meta={name:'One',stage:'kali',tier:'baseline',packages:['one']};
 const body='<details><summary>Prepare One</summary><a id="setup-one"></a>\n```bash\nsudo apt install one\n```\n</details>';
 const source=m=>({title:'Owner',url:'/owner/',markdown:'<!-- tool-setup '+JSON.stringify(m)+' -->\n'+body+'\n<!-- /tool-setup -->'});
 assert.throws(()=>collectToolSetups([],[{name:'One'}]),/Missing/);
 assert.throws(()=>collectToolSetups([source(meta),source(meta)],[{name:'One'}]),/Duplicate/);
 assert.throws(()=>collectToolSetups([source(meta)],[]),/no owning/);
 assert.throws(()=>collectToolSetups([source({...meta,packages:['one;other']})],[{name:'One'}]),/Invalid package/);
 const setups=collectToolSetups([source(meta)],[{name:'One'}]);
 const template=['baseline-packages','baseline-kali','baseline-linux','baseline-windows','optional-setups','track-tool-links'].map(k=>'<!-- '+k+' -->').join('\n');
 const output=renderToolSetupPage(template,setups,'links');assert.equal(output.split('sudo apt install one').length-1,1);
 assert.throws(()=>renderToolSetupPage('missing',setups,''),/exactly one/);
});
