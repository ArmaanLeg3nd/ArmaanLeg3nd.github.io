import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {collectToolSetups,collectToolConfigurations,renderToolSetupPage} from '../src/lib/nstsec-tool-setup.mjs';
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
 const template=['baseline-packages','baseline-kali','baseline-linux','baseline-windows','optional-setups','track-tool-links','bundled-tool-lookup','reusable-configurations'].map(k=>'<!-- '+k+' -->').join('\n');
 const output=renderToolSetupPage(template,setups,'links');assert.equal(output.split('sudo apt install one').length-1,1);
 assert.throws(()=>renderToolSetupPage('missing',setups,''),/exactly one/);
});

test('stock Kali tools stay discoverable and newly identified extras have setup',()=>{
 const utility=snapshot.pages.find(p=>p.path==='tools.md');const text=plain(utility.html);
 const bundled=JSON.parse(readFileSync(new URL('../src/content/oscp-bundled-tools.json',import.meta.url),'utf8'));
 for(const name of ['ffuf','NetExec','WPScan','Impacket examples','Nmap and NSE']){
  assert.ok(bundled.tools.some(t=>t.name===name),name);assert.ok(text.includes(name));
 }
 assert.ok(text.includes('sudo apt install ffuf'));
 for(const name of ['Process Monitor','RSAT Active Directory PowerShell','oletools: MacroRaptor','SecLists','sqlcmd','MongoDB shell','Get-SPN.ps1','exe2hex'])assert.ok(snapshot.tools.some(t=>t.name===name),name);
 assert.ok(!snapshot.tools.some(t=>t.name==='w3af'));
 const smtp=snapshot.pages.find(p=>p.path==='services-exploitation/25-465-587-smtp.md');
 assert.ok(plain(smtp.html).includes('python3 vrfy.py TARGET USER'));
 assert.ok(!plain(smtp.html).includes('print banner'));
});

test('reusable configurations are shared once and usage selects the prepared paths',()=>{
 const utility=snapshot.pages.find(p=>p.path==='tools.md'),text=plain(utility.html),names=[];
 for(const page of snapshot.pages.filter(p=>!['tools.md','public-exploit-finder.md'].includes(p.path))){
  for(const match of page.html.matchAll(/<!-- tool-config (\{[^\n]+\}) -->\s*([\s\S]*?)<!-- \/tool-config -->/g)){
   const meta=JSON.parse(match[1]),anchor=match[2].match(/id="(config-[^"]+)"/)[1];names.push(meta.name);
   assert.ok(utility.html.includes('href="'+page.url+'#'+anchor+'"'));
   assert.ok(page.html.includes('id="'+meta.usage+'"'));
   for(const code of blocks(match[2]))for(const line of code.split('\n').filter(Boolean))assert.ok(text.includes(line),meta.name+': lost config command '+line);
  }
 }
 assert.deepEqual(names.sort(),['SOCKS client profile','Legacy Samba client profile','Kali SSH endpoint','HTTP file receiver','TFTP file receiver'].sort());
 const scan=plain(snapshot.pages.find(p=>p.path==='network-scan.md').html);
 assert.equal(scan.split('exclude-tags = "default"').length-1,1);
 assert.equal(text.split('exclude-tags = "default"').length-1,1);
 assert.ok(!scan.includes('--config ./autorecon.toml'));
 assert.ok(text.includes('config/autorecon.toml')&&text.includes('config/proxychains-oscp.conf'));
 const windows=plain(snapshot.pages.find(p=>p.path==='privilege-escalation/windows-privesc.md').html);
 assert.ok(!windows.includes('PermitRootLogin yes'));
 assert.ok(windows.includes('impacket-psexec -port 1445'));
});

test('configuration metadata rejects ambiguous and invalid receiving sections',()=>{
 const source={path:'owner.md',title:'Owner',url:'/owner/',markdown:'<!-- tool-config {"name":"Example","usage":"run-it"} -->\n<details><a id="config-example"></a>\n```bash\ntrue\n```\n</details>\n<!-- /tool-config -->'};
 assert.equal(collectToolConfigurations([source])[0].usage,'/owner/#run-it');
 assert.throws(()=>collectToolConfigurations([source,source]),/Duplicate/);
 assert.throws(()=>collectToolConfigurations([{...source,markdown:source.markdown.replace('run-it','javascript:bad')}]),/Incomplete/);
});
