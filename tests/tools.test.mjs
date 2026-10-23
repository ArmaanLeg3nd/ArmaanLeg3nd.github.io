import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { freshInvestigation, validateInvestigation, parseInvestigation, serializeInvestigation, addStep, removeStep, getSessionInvestigation, setSessionInvestigation } from '../src/lib/investigation.ts';
import { substitute, validValue, getSessionCommandValues, setSessionCommandValues } from '../src/lib/oscp-commands.ts';
import { layoutInvestigation } from '../src/lib/attack-graph.ts';
const snapshot = JSON.parse(readFileSync(new URL('../src/content/oscp.snapshot.json',import.meta.url),'utf8'));
const step = (id='s1', methodId='path-hosts') => ({ id,methodId,methodTitle:'Validate reachability',status:'planned',host:'host-a',identity:'user-a',capability:'',observation:'Synthetic test observation',createdAt:new Date().toISOString() });
test('snapshot accounts for the entire reviewed inventory and all valid conditional transitions',() => {
  assert.equal(snapshot.methods.length,166); assert.equal(snapshot.topics.length,15); assert.equal(snapshot.stages.length,8);
  assert.equal(snapshot.topics.reduce((sum,t) => sum+t.families.length,0),54);
  assert.equal(snapshot.methods.reduce((sum,m) => sum+m.next.length,0),505);
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
