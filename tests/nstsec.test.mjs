import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {collectExploitLinks} from '../src/lib/nstsec-exploit-links.mjs';
const root=new URL('../',import.meta.url);
const snapshot=JSON.parse(readFileSync(new URL('src/content/oscp-nstsec.snapshot.json',root),'utf8'));
test('adapted track pages and all local destinations exist in the built site',()=>{
 assert.equal(snapshot.pages.length,44);
 assert.equal(snapshot.pages.filter(p=>!p.depth&&!['tools.md','public-exploit-finder.md'].includes(p.path)).length,8);
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
test('exploit finder aggregates actual owning links without copying procedures or adding a track',()=>{
 const finder=snapshot.pages.find(p=>p.path==='public-exploit-finder.md');
 assert.ok(finder);assert.ok(!finder.html.includes('<pre'));assert.ok(!finder.html.includes('<!--'));
 for(const url of ['https://www.exploit-db.com/','https://packetstorm.news/','https://www.rapid7.com/db/','https://nvd.nist.gov/vuln/search'])assert.ok(finder.html.includes('href="'+url+'"'));
 const entries=collectExploitLinks(snapshot.pages);
 for(const name of ['WES-NG','Linux Exploit Suggester 2','Watson — legacy alternative','ZeroLogon public PoC and recovery guidance','Windows kernel exploit collection'])assert.ok(entries.some(e=>e.name===name));
 for(const entry of entries){
  assert.equal(new Set(entry.mentions.map(m=>m.owner+' '+m.url)).size,entry.mentions.length);
  for(const mention of entry.mentions){
   const [url,anchor]=mention.owner.split('#');const owner=snapshot.pages.find(p=>p.url===url);
   assert.ok(owner&&!['tools.md','public-exploit-finder.md'].includes(owner.path));
   assert.ok(owner.html.includes('href="'+mention.url.replaceAll('&','&amp;')+'"'));
   assert.ok(!anchor||owner.html.includes('id="'+anchor+'"'));
   assert.ok(finder.html.includes('href="'+mention.owner+'"'));
   assert.ok(finder.html.includes('href="'+mention.url.replaceAll('&','&amp;')+'"'));
  }
 }
 const windows=snapshot.pages.find(p=>p.path==='privilege-escalation/windows-privesc.md').html.replace(/<[^>]*>/g,'');
 assert.ok(windows.includes('python3 wes.py --update')&&windows.includes('--muc-lookup'));
 assert.ok(!windows.includes('CVE-2018-8210'));
 const html=readFileSync(new URL('dist'+finder.url+'index.html',root),'utf8');
 assert.ok(html.includes('aria-current="page">Public exploit finder</a>'));
});

test('exploit aggregation ignores missing and unrelated resources and does not index itself',()=>{
 const page={title:'Windows',path:'windows.md',url:'/windows/',html:'<h2 id="finding">Finding</h2><a href="https://github.com/bitsadmin/wesng">WES</a><a href="https://github.com/bitsadmin/wesng">duplicate</a><a href="https://github.com/bitsadmin/wesng-evil">unrelated</a>'};
 const result=collectExploitLinks([page,{...page,path:'public-exploit-finder.md',url:'/finder/'}]);
 assert.equal(result.length,1);assert.equal(result[0].mentions.length,1);assert.equal(result[0].mentions[0].owner,'/windows/#finding');
 assert.deepEqual(collectExploitLinks([]),[]);
});

test('tool index links each catalogued tool to its source notes and resolves fragments',()=>{
 assert.ok(snapshot.tools.length>25&&snapshot.tools.length<70);
 for(const name of ['Nmap and NSE','curl','GNU coreutils','Hydra','PowerShell and built-in cmdlets','linPEAS','winPEAS','PowerView','Mimikatz'])assert.ok(!snapshot.tools.some(t=>t.name===name),name+': stock tool should be omitted');
 for(const name of ['Seatbelt','SharpUp','nmapAutomator','Linux Smart Enumeration','Rubeus'])assert.ok(snapshot.tools.some(t=>t.name===name),name+': extra should be included');
 for(const name of ['AutoRecon','pspy','PrivescCheck','enum4linux-ng','ldapdomaindump','Our native AD / host helpers'])assert.ok(snapshot.tools.some(t=>t.name===name),name+': selected automation should be indexed');
 assert.ok(!snapshot.tools.some(t=>t.name==='Our enumeration launchers'),'unreferenced wrappers are not an extra dependency');
 for(const name of ['Mynmap','LinEnum','windows-privesc-check','Neo4j'])assert.ok(!snapshot.tools.some(t=>t.name===name),name+': retired routine dependency');
 const index=snapshot.pages.find(p=>p.path==='tools.md');
 assert.ok(index);
 assert.ok(!index.html.includes('What to obtain'));
 assert.ok(index.html.includes('Used in this track')&&index.html.includes('Network Scan')&&index.html.includes('Active Directory'));
 for(const tool of snapshot.tools){
  assert.ok(index.html.includes(tool.url.replaceAll('&','&amp;')),tool.name+': upstream link');
  assert.ok(tool.mentions.length,tool.name+': no owning page');
  for(const mention of tool.mentions){
   const [url,fragment]=mention.url.split('#');
   const page=snapshot.pages.find(p=>p.url===url);
   assert.ok(page,tool.name+': receiving page');
   for(const source of mention.sources)assert.ok(page.html.includes('href="'+source+'"'),tool.name+': indexed link must exist on the track page');
   if(fragment)assert.ok(page.html.includes('id="'+fragment+'"'),tool.name+': section fragment');
  }
 }
});
test('the reference entry redirects to the adapted collection',()=>{
 assert.ok(readFileSync(new URL('dist/oscp/index.html',root),'utf8').includes('/oscp/nstsec/'));
 assert.ok(existsSync(new URL('dist/oscp/reference/INDEX/index.html',root)));
});
test('automation replaces only the overlapping first passes and retains focused work',()=>{
 const page=path=>snapshot.pages.find(p=>p.path===path).html.replace(/<\/?span\b[^>]*>/g,'');
 assert.ok(!snapshot.pages.some(p=>p.path==='automation.md'));
 assert.ok(page('services-exploitation/80-443-http-s.md').includes('ffuf.json'));
 assert.ok(page('services-exploitation/139-445-smb.md').includes('nxc smb HOST_FQDN --use-kcache --shares --pass-pol'));
 assert.ok(page('network-scan.md').includes('top-tcp-ports,all-tcp-ports'));
 assert.match(page('network-scan.md'),/exclude-tags = (?:&quot;|")default/);
 assert.ok(page('network-scan.md').includes('--config ./autorecon.toml'));
 for(const item of snapshot.pages)assert.ok(!/toolkit\.py|Invoke-EnumToolkit/.test(item.html),item.url+': no custom launcher dependency');
 assert.ok(page('privilege-escalation/linux-privesc.md').includes('timeout --signal=INT 120s'));
 assert.ok(page('privilege-escalation/windows-privesc.md').includes('Get-HostSurface.ps1'));
 assert.ok(page('active-directory/ad-automatic-enumeration.md').includes('Invoke-ADMap.ps1'));
 assert.ok(page('services-exploitation/80-443-http-s.md').includes('id="basic-path-discovery-with-the-web-launcher"'));
 assert.ok(page('services-exploitation/139-445-smb.md').includes('id="existing-ticket-smb-inventory-with-our-launcher"'));
 assert.ok(page('network-scan.md').includes('--remote'));
 assert.ok(!page('network-scan.md').includes('./port-scan.sh'));
 assert.ok(page('services-exploitation/139-445-smb.md').includes('-Gm'));
 assert.ok(page('services-exploitation/139-445-smb.md').includes('-r 500-550,1000-1050'));
 assert.ok(page('services-exploitation/139-445-smb.md').includes('Connect/List a shared folder'));
 assert.ok(page('privilege-escalation/linux-privesc.md').includes('pspy64 -p -i 1000'));
 assert.ok(page('privilege-escalation/windows-privesc.md').includes('WindowsCredentialFiles WindowsVault'));
 assert.ok(page('active-directory/ad-automatic-enumeration.md').includes('--CollectionMethods Session'));
 assert.ok(page('active-directory/ad-automatic-enumeration.md').includes('--CollectionMethods LocalGroup'));
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

test('every local section handoff has a receiving anchor',()=>{
 const missing=[];
 for(const p of snapshot.pages)for(const m of p.html.matchAll(/href="([^"]*)"/g)){
  let u;try{u=new URL(m[1].replaceAll('&amp;','&'),'https://local'+p.url);}catch{continue;}
  if(u.origin!=='https://local'||!u.hash)continue;
  const target=snapshot.pages.find(q=>q.url===u.pathname);
  const built=new URL('dist'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''),root);
  const html=target?.html||(existsSync(built)?readFileSync(built,'utf8'):'');
  const id=decodeURIComponent(u.hash.slice(1));
  if(![...html.matchAll(/\bid="([^"]+)"/g)].some(x=>x[1]===id))missing.push(p.path+' -> '+u.pathname+u.hash);
 }
 assert.deepEqual(missing,[]);
});

test('parent capabilities remain discoverable after consolidation',()=>{
 const page=path=>snapshot.pages.find(p=>p.path===path).html.replace(/<\/?span\b[^>]*>/g,'');
 assert.ok(page('services-exploitation/21-ftp.md').includes('href="/oscp/nstsec/brute-forcing/#ftp"'));
 assert.ok(!page('services-exploitation/21-ftp.md').includes('Brute Forcing SSH'));
 assert.ok(page('brute-forcing.md').includes('ftp-found.txt TARGET ftp'));
 assert.ok(page('services-exploitation/139-445-smb.md').includes('-s /PATH/shares.txt'));
 assert.ok(page('privilege-escalation/linux-privesc.md').includes('-s usr010,net,pro'));
 assert.ok(page('privilege-escalation/linux-privesc.md').includes('./linpeas_linux_amd64'));
 assert.ok(page('privilege-escalation/windows-privesc.md').includes('systeminfo userinfo'));
 assert.ok(page('transfer-files/README.md').includes('scp /tmp/FILE USER@LHOST:'));
 assert.ok(page('network-scan.md').includes('nmap --script-help ftp-anon'));
 for(const path of ['active-directory/ad-manual-enumeration.md','active-directory/ad-lateral-movement.md'])assert.ok(!page(path).includes('user-content-fn-'));
 const aliases={
  'network-scan.md':['manual-network-scan','nmap','automatic-network-scan','nmapautomator','netcat','masscan'],
  'privilege-escalation/linux-privesc.md':['linpeas','linux-smart-enumeration'],
  'privilege-escalation/windows-privesc.md':['winpeas-recommended','seatbelt','accesschkexe'],
  'active-directory/ad-automatic-enumeration.md':['sharpound','bloodhound'],
  'services-exploitation/139-445-smb.md':['enum4linux','smbclient--smbmap--crackmapexec']
 };
 for(const [path,ids] of Object.entries(aliases))for(const id of ids)assert.ok(page(path).includes('id="'+id+'"'),path+'#'+id);
});

test('readiness cleanup removes obsolete advice and unsafe default mutations',()=>{
 const page=path=>snapshot.pages.find(p=>p.path===path).html.replace(/<[^>]*>/g,'');
 const kerberos=page('active-directory/ad-attacking-kerberos.md'),movement=page('active-directory/ad-lateral-movement.md');
 assert.ok(!kerberos.includes('impacket_0_9_19')&&!kerberos.includes('pip install .'));
 assert.ok(kerberos.includes('impacket-GetUserSPNs')&&kerberos.includes('-request-user'));
 assert.ok(!movement.includes('only use the TGT on the machine it was created for'));
 assert.ok(!movement.includes('Affects ALL Windows Server versions'));
 assert.ok(movement.includes('impacket-ticketConverter')&&movement.includes('-user-id USER_RID'));
 assert.ok(!movement.includes('AllowUnencrypted')&&!movement.includes('trustedhosts -value *'));
 const sql=page('web-application-attacks/sql-injection.md');
 assert.ok(!sql.includes('FLUSHALL'));
 assert.ok(sql.includes('CONFIG SET dir ORIGINAL_DIR')&&sql.includes('DEL STAGING_KEY'));
 assert.ok(!page('transfer-files/README.md').includes('net localgroup administrators /add'));
 const linux=page('privilege-escalation/linux-privesc.md');
 assert.ok(!linux.includes('–k')&&!linux.includes('rpm –qa')&&!linux.includes("&gt; hash.txt'"));
 assert.ok(!page('privilege-escalation/windows-privesc.md').includes('winPEASany.exe quiet'));
});
