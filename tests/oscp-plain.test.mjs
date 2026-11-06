import test from 'node:test';
import {searchReference,validNavigationState} from '../src/lib/oscp-plain-search.ts';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {plainPages,plainURL,renderPlain,renderIndex,renderPageIndex,localTarget} from '../src/lib/oscp-plain.ts';

const decode=text=>text.replace(/&(?:#x([0-9a-f]+)|#([0-9]+)|(amp|lt|gt|quot|apos));/gi,(_,hex,dec,name)=>hex?String.fromCodePoint(parseInt(hex,16)):dec?String.fromCodePoint(+dec):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[name]));
const blocks=text=>[...text.matchAll(/^```[^\n]*\n([\s\S]*?)\n```/gm)].map(m=>m[1]);

test('plain section covers every pinned document, without the themed shell',()=>{
  assert.ok(plainPages.length>100);
  assert.ok(plainPages.some(p=>p.path==='notes/ad-investigation/quick-reference.md'));
  assert.equal(new Set(plainPages.map(plainURL)).size,plainPages.length);
  for(const page of plainPages) {
    const target=new URL('../dist'+plainURL(page)+'index.html',import.meta.url);
    assert.ok(existsSync(target),page.path);
    const html=readFileSync(target,'utf8');
    assert.ok(html.includes('aria-label="Reference index"') && html.includes('id="document"'),page.path);
    assert.ok(html.includes('color-scheme') && html.includes('position:fixed'),page.path);
    assert.ok(!html.includes('ClientRouter') && !html.includes('tools-surface') && !html.includes('data-theme='),page.path);
    assert.ok(html.includes('id="reference-search"')&&html.includes('<noscript>'),page.path+': progressive search fallback');
  }
});

test('commands remain intact and all current-document heading links resolve',async()=>{
  for(const page of plainPages) {
    const {html,headings}=await renderPlain(page);
    const code=[...html.matchAll(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)].map(m=>decode(m[1]).trimEnd());
    for(const block of blocks(page.markdown))assert.ok(preserved(block,code),page.path+': command preservation');
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(ids.length,new Set(ids).size,page.path+': duplicate anchors');
    for(const h of headings)assert.ok(ids.includes(h.slug),page.path+': '+h.slug);
    const nav=renderIndex(page,headings);
    for(const match of nav.matchAll(/href="([^"]+)#([^"]+)"/g)) {
      if(decode(match[1])===plainURL(page))assert.ok(ids.includes(match[2]),page.path+': index anchor');
    }
  }
});

test('relative and public source links stay within the plain section',()=>{
  assert.equal(localTarget('../reference/06-ad-lateral-movement/README.md','notes/Attack_Strategy_Map.md'),'/oscp/reference/06-ad-lateral-movement/');
  assert.equal(localTarget('https://github.com/ArmaanLeg3nd/OSCP-Exploitation-Reference/blob/main/notes/ad-investigation/shares.md','README.md'),'/oscp/notes/ad-investigation/shares/');
  assert.equal(localTarget('#output','README.md'),'#output');
  assert.equal(localTarget('https://example.com/docs','README.md'),'https://example.com/docs');
});

test('every plain internal link and diagram resolves in the generated site',()=>{
  const cache=new Map();
  for(const page of plainPages) {
    const file=new URL('../dist'+plainURL(page)+'index.html',import.meta.url);
    const html=readFileSync(file,'utf8');
    for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target=decode(match[1]);
      if(!target.startsWith('/oscp/') && !target.startsWith('#'))continue;
      const url=new URL(target,'https://reference.invalid'+plainURL(page));
      const path=url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname;
      const targetFile=new URL('../dist'+path,import.meta.url);
      assert.ok(existsSync(targetFile),page.path+': '+target);
      if(url.hash && path.endsWith('.html')) {
        let text=cache.get(path);
        if(!text){text=readFileSync(targetFile,'utf8');cache.set(path,text);}
        const id=decodeURIComponent(url.hash.slice(1));
        assert.ok(text.includes('id="'+id+'"'),page.path+': missing '+target);
      }
    }
  }
});

function preserved(block,code) {
 if(code.includes(block.trimEnd()))return true;
 return code.some((part,start)=>{
   const wanted=block.trimEnd();if(!wanted.startsWith(part))return false;
   let joined=part;
   for(let i=start+1;i<code.length&&joined.length<wanted.length;i++) {
     joined+='\n\n'+code[i];if(joined===wanted)return true;
   }
   return false;
 });
}

test('study sections and variants are numbered and every method has result-specific receiving links',async()=>{
 let routes=0,variants=0;
 const methods=JSON.parse(readFileSync(new URL('../src/content/oscp.snapshot.json',import.meta.url),'utf8')).methods;
 for(const page of plainPages) {
   const {html,headings}=await renderPlain(page);
   for(const h of headings)assert.match(h.text,/^\d+(?:\.\d+)*\s/,page.path+': numbered heading');
   variants+=[...html.matchAll(/id="variant-/g)].length;
   for(const match of html.matchAll(/<table data-result-routes="([^"]+)">([\s\S]*?)<\/table>/g)) {
     routes++;
     const method=methods.find(m=>m.id===match[1]);
     assert.ok(method,match[1]);
     const rows=[...match[2].matchAll(/<tbody>([\s\S]*?)<\/tbody>/g)][0][1].match(/<tr>/g)||[];
     assert.equal(rows.length,method.next.length,match[1]+': complete conditions');
     for(const row of match[2].matchAll(/<tr><td>([\s\S]*?)<\/tr>/g))assert.equal((row[1].match(/<a href=/g)||[]).length,1,match[1]+': one destination per outcome');
   }
   const left=renderIndex(page,headings);
   const right=renderPageIndex(page,headings);
   assert.ok(!left.includes('#'),page.path+': left index only contains chapters/sections');
   for(const h of headings.filter(h=>h.depth>1))assert.ok(right.includes('#'+h.slug),page.path+': right index contains heading');
   if(page.path.startsWith('notes/ad-investigation/'))assert.ok(!html.includes('Next pages'),page.path+': no generic next-page list');
 }
 assert.equal(routes,methods.length,'every reviewed method has conditional handoffs');
 assert.ok(variants>50,'numbered variants are exposed in the contents index');
});

test('conditional link numbers match the actual receiving method heading',async()=>{
 const rendered=new Map();
 for(const page of plainPages.filter(p=>p.path.startsWith('notes/methods/')))rendered.set(plainURL(page),(await renderPlain(page)).html);
 let links=0;
 for(const html of rendered.values())for(const table of html.matchAll(/<table data-result-routes="[^"]+">([\s\S]*?)<\/table>/g))for(const link of table[1].matchAll(/<a href="([^"]+)">§([\d.]+) —/g)) {
   const [path,anchor]=decode(link[1]).split('#');
   const receiver=rendered.get(path);assert.ok(receiver,path);
   const start=receiver.indexOf('<a id="'+anchor+'">');assert.ok(start>=0,anchor);
   const heading=receiver.slice(start).match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1];
   assert.ok(heading&&decode(heading).startsWith(link[2]+' '),link[1]+': receiving section number');
   links++;
 }
 assert.ok(links>400,'complete conditional link coverage');
});

test('search finds exact numbers, fields and failures without altering destinations',()=>{
 const entries=JSON.parse(readFileSync(new URL('../dist/oscp/search.json',import.meta.url),'utf8'));
 assert.ok(entries.length>1000);
 assert.equal(searchReference(entries,'6.2.2.3')[0].number,'6.2.2.3');
 assert.ok(searchReference(entries,'ObjectAceType').length>0);
 assert.ok(searchReference(entries,'NT_STATUS_ACCESS_DENIED').length>0);
 assert.equal(searchReference(entries,'').length,0);
 assert.equal(searchReference(entries,'x'.repeat(161)).length,0);
 for(const result of searchReference(entries,'SPN'))assert.ok(result.url.startsWith('/oscp/')&&result.url.includes('#'));
});

test('navigation memory accepts only bounded UI state',()=>{
 const state=validNavigationState({open:{'6.2':true,secret:'PASSWORD'},left:20,right:{'/oscp/notes/ad-investigation/shares/':80,'https://other.test/':30},query:'SECRET',token:'SECRET'});
 assert.deepEqual(state.open,{'6.2':true});
 assert.deepEqual(state.right,{'/oscp/notes/ad-investigation/shares/':80});
 assert.ok(!JSON.stringify(state).includes('SECRET'));
 assert.equal(validNavigationState(null).left,0);
 assert.equal(validNavigationState({left:-4}).left,0);
});

test('glossary links and contextual aids do not modify executable code',async()=>{
 let panels=0,terms=0;
 for(const page of plainPages) {
   const {html}=await renderPlain(page);
   panels+=(html.match(/data-command-context=/g)||[]).length;
   terms+=(html.match(/class="glossary-term"/g)||[]).length;
   for(const block of html.matchAll(/<pre[\s\S]*?<\/pre>/g))assert.ok(!block[0].includes('class="glossary-term"'),page.path);
 }
 assert.equal(panels,166);
 assert.ok(terms>100);
});

test('AD support includes matched output cases, stop rules and unanswered practice',()=>{
 const snapshot=JSON.parse(readFileSync(new URL('../src/content/oscp-plain.snapshot.json',import.meta.url),'utf8'));
 for(const key of ['users','shares','spns','acl','bloodhound']) {
   const page=snapshot.pages.find(p=>p.path==='notes/ad-investigation/'+key+'.md');
   for(const label of ['Expected — raw evidence','Interesting — raw evidence','Failed / inconclusive — raw evidence','Normalized observations','Stop when','Revisit only when'])assert.ok(page.markdown.includes(label),key+': '+label);
 }
 for(const key of ['glossary','method-choice','worked-chain','practice-cases','notes-feedback'])assert.ok(snapshot.pages.some(p=>p.path==='notes/ad-investigation/'+key+'.md'),key);
 const practice=snapshot.pages.find(p=>p.path==='notes/ad-investigation/practice-cases.md').markdown;
 assert.equal((practice.match(/## 6\.6\.4\.\d Case/g)||[]).length,5);
 assert.ok(!practice.includes('Correct answer:')&&!practice.includes('Solution:'));
});

test('quick-use pilot retains all existing cheatsheet heading numbers',async()=>{
 const stable=JSON.parse(readFileSync(new URL('../src/content/oscp-section-numbers.json',import.meta.url),'utf8'));
 for(const page of plainPages.filter(p=>p.path in stable)){const rendered=await renderPlain(page);for(const [slug,number] of Object.entries(stable[page.path].headings)){assert.equal(rendered.headings.find(h=>h.slug===slug)?.number,number,page.path+'#'+slug);}}
 const ad=plainPages.find(p=>p.path==='cheatsheets/active-directory.md');assert.equal((ad.markdown.match(/function LDAPSearch \{/g)||[]).length,1);
});

test('paired cues preserve steps and contextual search keeps exact number priority',async()=>{
 const {commandPairs}=await import('../src/lib/oscp-pairs.ts');
 const code='<pre><code>one</code></pre>';assert.ok(commandPairs(code+'<blockquote>cue</blockquote>').includes('command-pair'));
 assert.equal(commandPairs(code+'<h2>Another step</h2>'+code+'<p>plain</p>'),code+'<h2>Another step</h2>'+code+'<p>plain</p>');
 const entries=[{number:'1',title:'1 error',url:'/one',text:'1 error',topic:'other',kind:'Procedure'},{number:'2',title:'error',url:'/two',text:'error',topic:'ad',kind:'Quick command'}];
 assert.equal(searchReference(entries,'error',10,'ad')[0].number,'2');assert.equal(searchReference(entries,'1',10,'ad')[0].number,'1');
 const ad=await renderPlain(plainPages.find(p=>p.path==='cheatsheets/active-directory.md'));assert.ok(ad.html.includes('command-pair'));assert.ok(renderPageIndex(plainPages[0],ad.headings).includes('data-page-branch'));
});

test('cheatsheets follow workflow order and retain legacy heading destinations',async()=>{
 const registry=JSON.parse(readFileSync(new URL('../src/content/oscp-section-numbers.json',import.meta.url),'utf8'));
 const names=['discovery-scanning','service-opportunities','web-mapping','web-exploitation','public-exploits','shells-payloads','payload-execution','credentials-cracking','linux-privesc','windows-privesc','ad-investigation','active-directory','pivoting','evidence-reporting','tool-selection','tools-and-scripts','tool-command-reference'];
 for(const [i,name] of names.entries()){const path='cheatsheets/'+name+'.md',row=registry[path];assert.equal(row.number,'10.'+(i+1));const {html}=await renderPlain(plainPages.find(p=>p.path===path));for(const [slug,number] of Object.entries(row.headings)){if(slug.startsWith('variant-'))continue;const old=row.legacyNumber+number.slice(row.number.length);assert.ok(html.includes('id="s-'+old.replaceAll('.','-')+'"'),path+' legacy '+old);}}
});

test('only reviewed method choices fold; preflight and sequential steps remain visible',async()=>{
 const move=await renderPlain(plainPages.find(p=>p.path==='notes/methods/lateral-movement.md'));
 assert.ok(move.html.includes('<details data-method-fold>'));assert.ok(move.html.includes('method-choice-cue'));
 assert.ok(!move.html.includes('<details data-method-fold open'));
 const {foldMethods}=await import('../src/lib/oscp-folds.ts');
 const steps='<h2 id="step">Step 1: prepare</h2><p>required</p><h2>Step 2: verify</h2>';assert.equal(foldMethods(steps,'reference/08-evidence-reporting/01-attack-tracking-and-evidence.md'),steps);
 for(const page of plainPages){const {html}=await renderPlain(page);assert.equal((html.match(/<details\b/g)||[]).length,(html.match(/<\/details>/g)||[]).length,page.path);}
});

test('full review covers every page/method and AD approaches have searchable stable destinations',async()=>{
 const review=JSON.parse(readFileSync(new URL('../src/content/oscp-fold-review.json',import.meta.url),'utf8'));assert.equal(Object.keys(review).length,plainPages.length);
 const {html}=await renderPlain(plainPages.find(p=>p.path==='notes/methods/ad-mapping.md'));for(const key of ['native-windows','adsi','ldap','powerview'])assert.ok(html.includes('id="approach-'+key+'"'));
 const {buildSearchIndex}=await import('../src/lib/oscp-search-index.ts');const entries=await buildSearchIndex();assert.ok(entries.some(e=>e.url.endsWith('#approach-adsi')));
 const template=readFileSync(new URL('../src/pages/oscp/[...slug].astro',import.meta.url),'utf8');assert.ok(!template.includes('summary h2{display:inline;font-size:1.15em'));
 const linux=await renderPlain(plainPages.find(p=>p.path==='cheatsheets/linux-privesc.md'));assert.ok(!linux.html.includes('Fixed TCP relay:'));assert.ok(linux.html.includes('exact command, arguments and restrictions'));
});
