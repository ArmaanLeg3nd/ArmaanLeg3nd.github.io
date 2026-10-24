import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { freshInvestigation, validateInvestigation, parseInvestigation, serializeInvestigation, addStep, removeStep, getSessionInvestigation, setSessionInvestigation } from '../src/lib/investigation.ts';
import { substitute, validValue, unresolvedTokens, getSessionCommandValues, setSessionCommandValues } from '../src/lib/oscp-commands.ts';
import { buildSearchText, searchMethods } from '../src/lib/oscp-search.ts';
import { layoutInvestigation } from '../src/lib/attack-graph.ts';
import { startingGroups, investigationSteps, methodLabel } from '../src/lib/oscp-navigation.ts';
import { combinedProcedure, procedureNotes } from '../src/lib/oscp-procedure.ts';
import { stageURL, stageGuides } from '../src/lib/oscp-stages.ts';
import { annotateCheck } from '../src/lib/oscp-checks.ts';
import {topicLead,referenceFamilies} from '../src/lib/oscp-reference.ts';
const snapshot = JSON.parse(readFileSync(new URL('../src/content/oscp.snapshot.json',import.meta.url),'utf8'));
const step = (id='s1', methodId='path-hosts') => ({ id,methodId,methodTitle:'Validate reachability',status:'planned',host:'host-a',identity:'user-a',capability:'',observation:'Synthetic test observation',createdAt:new Date().toISOString() });

test('plain indexes replace decision maps and expose every stage and topic',() => {
  assert.deepEqual(Object.keys(stageGuides).sort(),snapshot.stages.map(stage=>stage.id).sort());
  const home=readFileSync(new URL('../dist/tools/oscp/index.html',import.meta.url),'utf8');
  for(const stage of snapshot.stages) {
    assert.ok(home.includes(`data-stage-index="${stage.id}"`));
    const html=readFileSync(new URL(`../dist${stageURL(stage.id)}index.html`,import.meta.url),'utf8');
    for(const id of stage.topics) {
      assert.ok(home.includes(`href="/tools/oscp/${id}/"`));
      assert.ok(html.includes(`href="/tools/oscp/${id}/#contents"`));
    }
    assert.ok(!html.includes('strategy-canvas') && !html.includes('data-map-topic'));
  }
  assert.ok(!home.includes('strategy-canvas') && !home.includes('data-stage-choice'));
});

test('every topic is a direct cheatsheet with complete commands and preserved detail links',() => {
  let count=0;
  for(const topic of snapshot.topics) {
    const html=readFileSync(new URL(`../dist/tools/oscp/${topic.id}/index.html`,import.meta.url),'utf8');
    assert.ok(html.includes('id="contents"') && html.includes('id="tools-and-scripts"'),topic.id);
    assert.ok(!html.includes('data-decision-topic') && !html.includes('data-prerequisite='),topic.id);
    assert.ok(html.indexOf('id="contents"')<html.indexOf('data-reference-method='),topic.id);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
    assert.equal(ids.length,new Set(ids).size,`${topic.id}: duplicate anchor`);
    for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(match[1]),`${topic.id}: ${match[1]}`);
    for(const method of snapshot.methods.filter(method=>method.topic===topic.id)) {
      assert.equal((html.match(new RegExp(`data-reference-method="${method.id}"`,'g'))||[]).length,1,method.id);
      assert.ok(html.includes(`href="#ref-${method.id}"`) && html.includes(`data-full-checks="${method.id}"`));
      for(const block of blocks(method.procedure))assert.ok(decodeHTML(html).includes(block),`${method.id}: command preservation`);
      const detail=readFileSync(new URL(`../dist/tools/oscp/${method.topic}/${method.id}/index.html`,import.meta.url),'utf8');
      for(const block of [...blocks(method.checks),...blocks(method.recognition.commands)])assert.ok(decodeHTML(detail).includes(block),`${method.id}: full checks preserved`);
      count++;
    }
  }
  assert.equal(count,166);
});

test('examples are commented with native syntax while unsafe formats stay unchanged',() => {
  for(const [language,prefix] of [['bash','# '],['powershell','# '],['cmd','REM '],['sql','-- '],['javascript','// ']]) {
    const source=`\`\`\`${language}\noriginal-command\n\`\`\``;
    const result=annotateCheck(source,{sample:'SYNTHETIC\nsecond line',meaning:'Short interpretation',confirm:'Exact condition'});
    assert.equal(result.inline,true,language);assert.ok(result.markdown.includes('original-command\n'),language);
    const lines=blocks(result.markdown)[0].split('\n').slice(1);
    assert.ok(lines.every(line=>line.startsWith(prefix)),language);
    assert.ok(result.markdown.includes(prefix+'Example output (synthetic):'));
  }
  for(const language of ['http','text','json','xml','html']) {
    const source=`\`\`\`${language}\nraw-request-or-client-input\n\`\`\``;
    assert.deepEqual(annotateCheck(source,{sample:'EXAMPLE'}),{markdown:source,inline:false});
  }
  const cmd='```cmd\nwhoami\n```';
  assert.deepEqual(annotateCheck(cmd,{sample:'data & command'}),{markdown:cmd,inline:false});
  const mixed='```bash\ncommand-a\n```\n```powershell\ncommand-b\n```';
  assert.deepEqual(annotateCheck(mixed,{sample:'EXAMPLE'}),{markdown:mixed,inline:false});
});

test('snapshot accounts for the entire reviewed inventory and all valid conditional transitions',() => {
  assert.equal(snapshot.methods.length,166); assert.equal(snapshot.topics.length,15); assert.equal(snapshot.stages.length,8);
  assert.equal(snapshot.topics.reduce((sum,t) => sum+t.families.length,0),54);
  assert.equal(snapshot.methods.reduce((sum,m) => sum+m.next.length,0),562);
  const ids=new Set(snapshot.methods.map(m => m.id)); assert.equal(ids.size,166);
  for(const m of snapshot.methods) { assert.ok(m.procedure && m.recognition.sample && m.recognition.confirm); for(const edge of m.next) assert.ok(ids.has(edge.id) && edge.when && edge.requires); }
  assert.equal(snapshot.stages.flatMap(s => s.topics).length,15);
  for(const topic of snapshot.topics) for(const flow of topic.workflow) assert.ok(flow.methods.every(id => ids.has(id)));
});
test('fresh investigation has no recorded steps or implied success',() => { const d=freshInvestigation('hash'); assert.deepEqual(d.steps,[]); assert.deepEqual(d.edges,[]); });
test('in-memory tool handoff uses the same allowlisted format without storing connection inputs',() => { const d=addStep(freshInvestigation('hash'),step());setSessionInvestigation({...d,commandValues:{TARGET:'EXCLUDED_TEST_VALUE'}});assert.equal(getSessionInvestigation().steps.length,1);assert.ok(!JSON.stringify(getSessionInvestigation()).includes('commandValues')); });
test('JSON round trip preserves records and explicit connections',() => {
  let d=addStep(freshInvestigation('hash'),step()); d=addStep(d,step('s2','tcp-coverage'),'s1');
  assert.deepEqual(parseInvestigation(serializeInvestigation(d)),d); assert.equal(d.edges[0].from,'s1');
});
test('independent records are never automatically connected',() => { let d=addStep(freshInvestigation('hash'),step()); d=addStep(d,step('s2')); assert.equal(d.edges.length,0); });
test('export reconstructs only allowlisted data, excluding command inputs',() => {
  const d={...freshInvestigation('hash'),commandValues:{TARGET:'synthetic-host'},password:'EXCLUDED_TEST_VALUE'};
  const exported=serializeInvestigation(d); assert.ok(!exported.includes('commandValues')); assert.ok(!exported.includes('EXCLUDED_TEST_VALUE'));
});
test('reject malformed, unsupported and oversized imports',() => {
  assert.throws(() => parseInvestigation('{')); assert.throws(() => parseInvestigation(' '.repeat(1024*1024+1)));
  assert.throws(() => validateInvestigation({...freshInvestigation('hash'),schemaVersion:2}));
  assert.throws(() => validateInvestigation({...freshInvestigation('hash'),steps:Array.from({length:201},(_,i) => step('s'+i))}));
});
test('reject duplicates and dangling edges atomically',() => {
  const d=addStep(freshInvestigation('hash'),step());
  assert.throws(() => validateInvestigation({...d,steps:[step(),step()]}));
  assert.throws(() => validateInvestigation({...d,edges:[{id:'edge',from:'s1',to:'missing',label:''}]}));
  assert.throws(() => addStep(d,step('s2'),'missing'));
});
test('cycles and repeat visits use distinct step IDs and survive import',() => {
  let d=addStep(freshInvestigation('hash'),step()); d=addStep(d,step('s2'),'s1');
  d.edges.push({id:'return',from:'s2',to:'s1',label:'Re-enumerate'});
  assert.equal(parseInvestigation(serializeInvestigation(d)).edges.length,2);
});
test('deleting a step removes only its incident connections',() => {
  let d=addStep(freshInvestigation('hash'),step()); d=addStep(d,step('s2'),'s1');
  const result=removeStep(d,'s1'); assert.equal(result.steps.length,1); assert.equal(result.edges.length,0);
});
test('unknown historical method IDs survive import for honest visualizer fallback',() => { const d=addStep(freshInvestigation('hash'),step('s1','retired-method')); assert.equal(parseInvestigation(serializeInvestigation(d)).steps[0].methodId,'retired-method'); });
test('graph distinguishes branches, disconnected steps, filters and return cycles',() => {
  let d=addStep(freshInvestigation('hash'),step());d=addStep(d,step('s2'),'s1');d=addStep(d,step('s3'),'s1');d=addStep(d,{...step('s4'),status:'confirmed'});
  d.edges.push({id:'feedback',from:'s3',to:'s1',label:'Return'});
  const graph=layoutInvestigation(d),nodes=new Map(graph.nodes.map(n => [n.step.id,n]));
  assert.ok(nodes.get('s2').x>nodes.get('s1').x);assert.equal(nodes.get('s2').x,nodes.get('s3').x);assert.notEqual(nodes.get('s2').y,nodes.get('s3').y);
  assert.ok(graph.connections.find(e => e.id==='feedback').backward);assert.equal(nodes.get('s4').x,nodes.get('s1').x);
  const filtered=layoutInvestigation(d,'confirmed');assert.equal(filtered.nodes.length,1);assert.equal(filtered.connections.length,0);
});
test('connection substitution respects token boundaries, templates and secrets placeholders',() => {
  const template="smbclient //TARGET/SHARE -U 'DOMAIN/USER' -p PORT; PASSWORD HASH TARGET_FILE";
  assert.equal(substitute(template,{TARGET:'host-a',DOMAIN:'LAB',USER:'alice',PORT:'445'}),"smbclient //host-a/SHARE -U 'LAB/alice' -p 445; PASSWORD HASH TARGET_FILE");
  assert.equal(substitute('TARGET',{TARGET:'host;whoami'}),'TARGET'); assert.equal(substitute('TARGET',{}),'TARGET');
});
test('connection field validation rejects operators, newlines and invalid port ranges',() => {
  assert.ok(validValue('PORTS','22,80,440-445')); assert.ok(!validValue('PORT','65536')); assert.ok(!validValue('PORTS','100-20'));
  for(const value of ['x\nwhoami','$(id)','x;id','x"']) assert.ok(!validValue('TARGET',value));
});
test('command values survive tool component changes in memory without leaking mutable state',() => {
  const values={TARGET:'example.invalid'};setSessionCommandValues(values);values.TARGET='changed.invalid';
  assert.equal(getSessionCommandValues().TARGET,'example.invalid');
  const restored=getSessionCommandValues();restored.TARGET='mutated.invalid';assert.equal(getSessionCommandValues().TARGET,'example.invalid');
  setSessionCommandValues({});assert.deepEqual(getSessionCommandValues(),{});
});
test('built pages share the same navigation, tool directory links and updated branding',() => {
  const routes=['','projects/','tools/','tools/oscp/','tools/oscp/services/service-smb/','tools/attack-path/'];
  for(const route of routes) {
    const url=new URL(`../dist/${route}index.html`,import.meta.url);
    if(!existsSync(url)) throw new Error('Run npm run build before the site integration checks');
    const html=readFileSync(url,'utf8');
    const header=html.match(/<header\b[^>]*class="site-header"[\s\S]*?<\/header>/)?.[0];
    const footer=html.match(/<footer\b[^>]*class="site-footer"[\s\S]*?<\/footer>/)?.[0];
    assert.ok(header && footer,route);
    for(const href of ['/','/projects/','/tools/']) { assert.ok(header.includes(`href="${href}"`),`${route}: header ${href}`);assert.ok(footer.includes(`href="${href}"`),`${route}: footer ${href}`); }
    assert.ok(/Projects (?:&amp;|&) tools/.test(header),`${route}: updated brand`);
    for(const href of ['/tools/oscp/','/tools/attack-path/']) assert.ok(footer.includes(`href="${href}"`),`${route}: tool link ${href}`);
  }
});
test('generated method and topic routes exist in a complete build',() => {
  if(!existsSync(new URL('../dist/tools/oscp/index.html',import.meta.url))) return;
  for(const m of snapshot.methods) assert.ok(existsSync(new URL(`../dist/tools/oscp/${m.topic}/${m.id}/index.html`,import.meta.url)),m.id);
  for(const t of snapshot.topics) assert.ok(existsSync(new URL(`../dist/tools/oscp/data/${t.id}.json`,import.meta.url)),t.id);
});
test('starting capability groups account for every topic without duplication',() => {
  const ids=startingGroups.flatMap(group => group.items.map(item => item[1]));
  assert.equal(ids.length,snapshot.topics.length);assert.equal(new Set(ids).size,ids.length);
  assert.deepEqual([...ids].sort(),snapshot.topics.map(topic => topic.id).sort());
});
const decodeHTML = (html) => html.replace(/&#x([0-9a-f]+);/gi,(_,code) => String.fromCodePoint(parseInt(code,16)))
  .replace(/&#([0-9]+);/g,(_,code) => String.fromCodePoint(+code))
  .replace(/&(amp|lt|gt|quot|apos);/g,(_,name) => ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[name]));
const blocks = markdown => Array.from(markdown.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm),match => match[1].trimEnd());
test('focused task pages retain every method, source command, recognition field and transition',() => {
  let totalMethods=0,totalEdges=0,totalBlocks=0;
  for(const method of snapshot.methods) {
    const html=readFileSync(new URL(`../dist/tools/oscp/${method.topic}/${method.id}/index.html`,import.meta.url),'utf8');
    const text=decodeHTML(html),codes=new Set(Array.from(html.matchAll(/<pre\b[^>]*>[\s\S]*?<code\b[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/g),match => decodeHTML(match[1]).trimEnd()));
    assert.equal((html.match(/data-method-id="/g)||[]).length,1,method.id);
    assert.ok(html.includes(`data-method-id="${method.id}"`),method.id);
    for(const key of ['title','access','conditions','result','clue','mechanics','example','verify','failure']) assert.ok(text.includes(method[key]),`${method.id}: ${key}`);
    for(const key of ['where','sample','spot','confirm','enabled','ruledout','unknown']) assert.ok(text.includes(method.recognition[key]),`${method.id}: recognition ${key}`);
    for(const block of [...blocks(method.procedure),...blocks(method.checks),...blocks(method.recognition.commands)]) {assert.ok([...codes].some(code => code.includes(block)),`${method.id}: missing command variant ${block.slice(0,60)}`);totalBlocks++;}
    assert.equal((html.match(/data-next-method="/g)||[]).length,method.next.length,method.id);
    for(const edge of method.next) assert.ok(text.includes(edge.when) && text.includes(edge.requires),`${method.id}: finding and prerequisites`);
    totalMethods++;totalEdges+=method.next.length;
  }
  assert.equal(totalMethods,166);assert.equal(totalEdges,562);assert.ok(totalBlocks>500);
});
test('command presentation preserves every source command in order without variant disclosures',() => {
  for(const method of snapshot.methods) {
    const combined=combinedProcedure(method.procedure);
    assert.ok(!/<\/?(?:details|summary)\b/i.test(combined),method.id);
    let cursor=0;
    for(const block of blocks(method.procedure)) {
      const index=combined.indexOf(block,cursor);
      assert.ok(index>=cursor,`${method.id}: missing or reordered source command`);
      cursor=index+block.length;
    }
  }
  const smb=snapshot.methods.find(method => method.id==='service-smb');
  const combined=combinedProcedure(smb.procedure);
  assert.ok(combined.includes('# Baseline: list shares without credentials'));
  assert.ok(combined.includes('# Variant — recursive retrieval'));
  assert.ok(blocks(combined).length<blocks(smb.procedure).length);
  assert.ok(combined.includes('```powershell\n'));
});
test('topic contents index every task once and keep navigation complete',() => {
  let count=0;
  for(const topic of snapshot.topics) {
    assert.equal(investigationSteps[topic.id].length,topic.workflow.length,topic.id);
    const html=readFileSync(new URL(`../dist/tools/oscp/${topic.id}/index.html`,import.meta.url),'utf8');
    assert.ok(html.includes('class="cheatsheet-contents"') && html.includes('id="topic-task-index"'),topic.id);
    assert.ok(!html.includes('data-method-id="'),topic.id);
    for(const method of snapshot.methods.filter(method=>method.topic===topic.id)) {
      assert.equal((html.match(new RegExp(`data-task-link="${method.id}"`,'g'))||[]).length,1,method.id);
      assert.ok(decodeHTML(html).includes(methodLabel(method)),method.id);count++;
    }
  }
  assert.equal(count,166);
});
test('lookup names are concise and unique within their topic; full usage notes remain available',() => {
  for(const topic of snapshot.topics) {
    const methods=snapshot.methods.filter(method=>method.topic===topic.id);
    assert.equal(new Set(methods.map(methodLabel)).size,methods.length,topic.id);
    for(const method of methods) assert.ok(methodLabel(method).length<method.title.length,method.id);
  }
  const smb=snapshot.methods.find(method=>method.id==='service-smb');
  assert.ok(!combinedProcedure(smb.procedure).includes('older material may use'));
  assert.ok(procedureNotes(smb.procedure).includes('share-level write access'));
  assert.ok(procedureNotes(smb.procedure).includes('https://') || procedureNotes(smb.procedure).includes('NetExec'));
});

test('listener and destination ports stay distinct, validated and visibly unresolved until filled',() => {
  assert.equal(substitute('nc -lvnp LPORT; nc TARGET PORT',{TARGET:'192.0.2.10',PORT:'80',LPORT:'4444'}),'nc -lvnp 4444; nc 192.0.2.10 80');
  for(const value of ['0','65536','-1','80-90','4444;id'])assert.ok(!validValue('LPORT',value));
  assert.ok(validValue('LPORT','65535'));
  assert.deepEqual(unresolvedTokens(substitute('TARGET PORT LHOST LPORT PASSWORD TARGET_FILE SELECT',{TARGET:'192.0.2.10',PORT:'80'})),['LHOST','LPORT','PASSWORD']);
});
test('troubleshooting search includes failure and recognition text and ranks exact lookup names first',() => {
  const methods=snapshot.methods.map(method=>({...method,search:buildSearchText(method)}));
  assert.equal(searchMethods(methods,'SMB')[0].id,'service-smb');
  assert.equal(searchMethods(methods,'sudo')[0].id,'linux-sudo');
  assert.equal(searchMethods(methods,'access denied')[0].id,'service-smb');
  assert.equal(searchMethods(methods,'NT_STATUS_ACCESS_DENIED')[0].id,'service-smb');
  assert.equal(searchMethods(methods,'clock skew')[0].id,'domain-state');
  assert.ok(searchMethods(methods,'wrong principal').some(method=>method.id==='windows-tasks'));
  assert.ok(searchMethods(methods,'NOPASSWD').some(method=>method.id==='linux-sudo'));
  assert.equal(searchMethods(methods,'Kerberoasting')[0].id,'kerberos-roast');
  assert.deepEqual(searchMethods(methods,'LAPS'),[]); // Do not match "collapse".
  assert.deepEqual(searchMethods(methods,';;;'),[]);
});
test('every task has a receiving handoff and is navigable from discovery',() => {
  const methods=new Map(snapshot.methods.map(method=>[method.id,method]));
  const incoming=new Set(snapshot.methods.flatMap(method=>method.next.map(edge=>edge.id)));
  assert.deepEqual(snapshot.methods.filter(method=>!incoming.has(method.id) && method.id!=='path-hosts'),[]);
  const seen=new Set(),queue=['path-hosts'];
  while(queue.length){const id=queue.pop();if(seen.has(id))continue;seen.add(id);queue.push(...methods.get(id).next.map(edge=>edge.id));}
  assert.equal(seen.size,166);
  for(const [source,target] of [['identify-app','service-ftp'],['identify-app','service-ldap'],['credential-classify','keepass-recovery'],['domain-directory','kerberos-asrep'],['pivot-state','ssh-remote-dynamic']])assert.ok(methods.get(source).next.some(edge=>edge.id===target));
});
test('command constraints remain visible and host-location changes separate same-language blocks',() => {
  const method=snapshot.methods.find(method=>method.id==='ssh-remote-dynamic');
  const combined=combinedProcedure(method.procedure);
  assert.ok(combined.includes('Run `ssh -V` on the pivot'));
  assert.ok(combined.includes('on Kali (the SSH server'));
  assert.ok(blocks(combined).length>=2);
  const source='Run on the pivot:\n\n```bash\nfirst-command\n```\n\nRun on Kali:\n\n```bash\nsecond-command\n```';
  const result=combinedProcedure(source);
  assert.equal(blocks(result).length,2);assert.ok(result.includes('#### Run on Kali'));
  const unrestricted='##### Baseline\n\n```bash\nfirst-command\n```\n\n<details><summary>Variant</summary>\n\n```bash\nsecond-command\n```\n\n</details>';
  assert.equal(blocks(combinedProcedure(unrestricted)).length,1);
});
test('all reference pages put commands first and keep detailed teaching in one closed notes section',() => {
  for(const method of snapshot.methods) {
    const html=readFileSync(new URL(`../dist/tools/oscp/${method.topic}/${method.id}/index.html`,import.meta.url),'utf8');
    const procedure=html.indexOf(`id="execute-${method.id}"`),next=html.indexOf(`id="next-${method.id}"`),notes=html.indexOf(`id="notes-${method.id}"`),recognition=html.indexOf(`id="check-${method.id}"`);
    assert.ok(procedure<next && next<notes && notes<recognition,method.id);
    assert.ok(!html.includes('walkthrough-heading') && !html.includes('IF THE CLUE MATCHES'),method.id);
    const article=html.slice(html.indexOf('data-method-id="'+method.id+'"'));
    assert.equal((article.match(/<details\b/g)||[]).length,1,method.id);
    assert.ok(!/<details[^>]*\bopen(?:[ >])/.test(article),method.id);
    if(blocks(method.procedure).length)assert.ok(html.indexOf('<pre',procedure)<notes,method.id);
    assert.ok(html.indexOf('SYNTHETIC EXAMPLE OUTPUT')>notes,method.id);
    assert.ok(html.includes('Explanation &amp; examples') || html.includes('Explanation & examples'),method.id);
    for(const edge of method.next) {
      assert.ok(html.includes(`<li data-next-method="${edge.id}">`),method.id);
      assert.ok(decodeHTML(html.slice(next,notes)).includes(edge.requires),method.id);
    }
    const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
    for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(match[1]),`${method.id}: ${match[1]}`);
  }
});

test('inline authored outcomes preserve command order and stay outside code blocks',() => {
  for(const method of snapshot.methods) {
    const quick=combinedProcedure(method.procedure,true);
    let cursor=0;
    for(const block of blocks(method.procedure)) {
      const index=quick.indexOf(block,cursor);assert.ok(index>=cursor,method.id);cursor=index+block.length;
    }
    assert.ok(!/<\/?(?:details|summary)\b/i.test(quick),method.id);
  }
  const source='##### Baseline\n\n```bash\nfirst-command\n```\n\n> **Decisive output:** FIRST-RESULT\n\n<details><summary>Different context</summary>\n\n> Requires SECOND-ACCESS\n\n```bash\nsecond-command\n```\n</details>';
  const quick=combinedProcedure(source,true);
  assert.ok(quick.indexOf('FIRST-RESULT')>quick.indexOf('first-command'));
  assert.ok(quick.indexOf('FIRST-RESULT')<quick.indexOf('#### Different context'));
  assert.ok(!blocks(quick).some(block=>block.includes('FIRST-RESULT')));
  assert.ok(quick.includes('Requires SECOND-ACCESS'));
});


test('all topics start with source-owned actionable workflows and valid finding routes',() => {
  assert.deepEqual(Object.keys(snapshot.playbooks).sort(),snapshot.topics.map(t=>t.id).sort());
  const methods=new Map(snapshot.methods.map(m=>[m.id,m]));
  for(const topic of snapshot.topics) {
    const html=readFileSync(new URL(`../dist/tools/oscp/${topic.id}/index.html`,import.meta.url),'utf8');
    assert.ok(html.indexOf('id="contents"')<html.indexOf('id="first-pass"'),topic.id);
    assert.ok(!html.includes('Continue checking'),topic.id);
    assert.ok(snapshot.playbooks[topic.id].length>=2,topic.id);
    for(const step of snapshot.playbooks[topic.id]) {
      const owner=methods.get(step.method);assert.ok(owner,step.method);
      const source=owner.procedure+'\n'+owner.checks;
      for(const block of blocks(step.commands)) for(const line of block.split('\n').filter(Boolean)) {
        assert.ok(source.includes(line),`${step.method}: command provenance: ${line}`);
        assert.ok(decodeHTML(html).includes(line),`${step.method}: visible command: ${line}`);
      }
      assert.ok(html.includes(`data-first-pass-method="${step.method}"`));
      for(const finding of step.findings) {
        assert.ok(methods.has(finding.target));
        assert.ok(html.includes(`data-first-pass-target="${finding.target}"`));
        assert.ok(finding.finding && finding.check);
      }
      assert.ok(methods.has(step.fallback.target));
    }
  }
});

test('first pass exposes practical collectors and operations instead of only setup or benchmarks',() => {
  const text=id=>snapshot.playbooks[id].map(s=>s.commands).join('\n');
  assert.ok(text('linux-privesc').includes('sh ./linpeas.sh | tee linpeas.txt'));
  assert.equal((text('linux-privesc').match(/\.\/pspy64/g)||[]).length,1);
  assert.ok(text('windows-privesc').includes('winPEASx64.exe log'));
  assert.ok(text('web-mapping').includes('gobuster dir'));
  assert.ok(text('ad-mapping').includes('SharpHound.exe'));
  assert.ok(text('discovery').includes('-p-'));
  assert.ok(text('public-exploits').includes('searchsploit --cve'));
  assert.ok(text('credentials').includes('hashcat -a 0'));
  const linux=snapshot.playbooks['linux-privesc'][0];
  assert.equal(linux.findings.find(f=>f.finding.includes('capability')).target,'linux-capabilities');
  assert.equal(linux.findings.find(f=>f.finding.includes('SUID')).target,'linux-suid');
});


test('toolbox covers every topic with valid owning tasks and upstream references',()=>{
  const methods=new Map(snapshot.methods.map(m=>[m.id,m]));
  assert.equal(new Set(snapshot.toolbox.map(tool=>tool.topic)).size,15);
  for(const tool of snapshot.toolbox) {
    assert.equal(methods.get(tool.method)?.topic,tool.topic);
    assert.match(tool.url,/^https:\/\//);
    const html=readFileSync(new URL(`../dist/tools/oscp/${tool.topic}/index.html`,import.meta.url),'utf8');
    assert.ok(decodeHTML(html).includes(tool.name) && html.includes(tool.url),tool.name);
    assert.ok(html.includes(`href="#ref-${tool.method}"`));
  }
  for(const [name,id] of [['SMBMap','service-smb'],['RunasCs','credential-use'],['LaZagne','windows-secrets']]) {
    assert.ok(snapshot.toolbox.some(tool=>tool.name===name && tool.method===id));
    assert.ok(methods.get(id).procedure.toLowerCase().includes(name.toLowerCase()));
  }
  assert.ok(methods.get('web-parameters').procedure.includes('-request-proto http'));
  assert.ok(methods.get('windows-enumerators').procedure.includes('Invoke-PrivescCheck -Report TXT,HTML'));
  assert.ok(methods.get('service-smb').procedure.includes('enum4linux-ng -A -w DOMAIN'));
});


test('plain operational introductions and collector-first ordering cover all topics',()=>{
  assert.deepEqual(Object.keys(topicLead).sort(),snapshot.topics.map(t=>t.id).sort());
  for(const topic of snapshot.topics) {
    assert.deepEqual(referenceFamilies(topic).flatMap(f=>f.methods).sort(),topic.families.flatMap(f=>f.methods).sort());
  }
  assert.ok(referenceFamilies(snapshot.topics.find(t=>t.id==='linux-privesc'))[0].methods.includes('linux-enumerators'));
  assert.ok(referenceFamilies(snapshot.topics.find(t=>t.id==='windows-privesc'))[0].methods[0]==='windows-enumerators');
});
