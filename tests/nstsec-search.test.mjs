import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareSearchPage, preparedNotes, searchPages} from '../src/lib/nstsec-search-index.ts';
import {searchNotes, occurrences, excerpt, serializeSearchIndex} from '../src/lib/nstsec-search.ts';

const page = prepareSearchPage({title:'Example',url:'/example/',html:'<h1>Example</h1><h2 id="commands">Commands</h2><pre><code><span>ldap</span><span>search</span> -D &quot;USER@DOMAIN&quot; &amp; echo &lt;value&gt;</code></pre><details><summary>Different identity</summary><p>Use ldapsearch with another context.</p><details><summary>Nested option</summary><p>needle nested</p></details></details><p>Tail context</p>'}, 'AD');

test('index decodes entities without inserting spaces inside syntax tokens',()=>{
 const found=searchNotes([page.index],'ldapsearch -D "USER@DOMAIN" & echo <value>');
 assert.equal(found.matches,1);assert.equal(found.results[0].previews[0].url,'/example/#commands');
 assert.ok(found.results[0].previews[0].text.includes('ldapsearch -D "USER@DOMAIN" & echo <value>'));
});
test('collapsed and nested alternatives get their own stable links and scope',()=>{
 const found=searchNotes([page.index],'needle');
 assert.equal(found.results[0].previews[0].url,'/example/#note-option-2');
 assert.match(page.html,/<details id="note-option-2">/);
 assert.ok(page.index.sections.find(s=>s.anchor==='commands').text.includes('Tail context'));
 assert.ok(!page.index.sections.find(s=>s.anchor==='note-option-1').text.includes('needle'));
 assert.equal(prepareSearchPage({title:'Example',url:'/example/',html:page.html},'AD').html,page.html);
});
test('literal special characters, whitespace and case work without regex semantics',()=>{
 assert.equal(searchNotes([page.index],' LDAPSEARCH ').matches,2);
 assert.deepEqual(occurrences('[x] [X]','[x]'),[0,4]);
 assert.equal(searchNotes([page.index],'[').matches,0);
 assert.equal(searchNotes([page.index],'   ').pages,0);
});
test('match counts cover all occurrences while previews stay bounded and contextual',()=>{
 const found=searchNotes(searchPages,'autorecon');
 assert.ok(found.matches>10);assert.ok(found.results.every(r=>r.previews.length<=2));
 assert.ok(found.results[0].previews[0].url.includes('#'));
 const ldap=searchNotes(searchPages,'ldapsearch').results[0];
 assert.ok(ldap.previews[0].text.includes('ldapsearch -'));
 const long='before '+ 'padding '.repeat(30)+'needle middle '+ 'padding '.repeat(30)+'needle after';
 const p={title:'Test',url:'/test/',track:'Test',sections:[{label:'Context',anchor:'context',text:long}]};
 assert.equal(searchNotes([p],'needle').results[0].previews.length,2);
 assert.ok(excerpt(long,long.indexOf('needle'),6).text.includes('needle'));
});
test('title matches rank first and page limits do not truncate total counts',()=>{
 const pages=Array.from({length:10},(_,i)=>({title:i===9?'Needle':'Page '+i,url:'/'+i+'/',track:'Track',sections:[{label:'Body',anchor:'body',text:'needle body'}]}));
 const found=searchNotes(pages,'needle');assert.equal(found.pages,10);assert.equal(found.matches,10);assert.equal(found.results.length,8);assert.equal(found.results[0].page.title,'Needle');
});
test('embedded JSON safely round-trips HTML-looking code and script terminators',()=>{
 const pages=[{title:'</script><img src=x>',url:'/x/',track:'X',sections:[{label:'Text',anchor:'text',text:'<script> & "quoted" </script>'}]}];
 const json=serializeSearchIndex(pages);assert.ok(!json.includes('<'));assert.deepEqual(JSON.parse(json),pages);
});
test('every generated section and alternative link resolves without changing note code',()=>{
 const snapshot=JSON.parse(readFileSync(new URL('../src/content/oscp-nstsec.snapshot.json',import.meta.url),'utf8'));
 const code=html=>[...html.matchAll(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g)].map(m=>m[1]);
 for(const p of snapshot.pages){const prepared=preparedNotes.get(p.url);assert.deepEqual(code(prepared.html),code(p.html),p.path);
 const ids=[...prepared.html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);for(const s of prepared.index.sections)if(s.anchor)assert.ok(ids.includes(s.anchor),p.path+'#'+s.anchor);}
});

test('default notes search reaches proof handling and exploit repair handoffs',()=>{
 const proof=searchNotes(searchPages,'proof.txt');
 const shell=proof.results.find(r=>r.page.url==='/oscp/nstsec/shells/');
 assert.ok(shell);assert.ok(shell.previews.some(p=>p.url.endsWith('#capture-proof-and-retain-reproduction-steps')));
 assert.ok(searchNotes(searchPages,'cross-compilation').results.some(r=>r.page.url==='/oscp/nstsec/services-exploitation/'));
 assert.ok(searchNotes(searchPages,'diagnostic order').results.some(r=>r.page.url==='/oscp/nstsec/shells/'));
});
