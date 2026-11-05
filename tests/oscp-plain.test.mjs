import test from 'node:test';
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
    assert.ok(!/<script\b/.test(html),page.path+': no browser JS required');
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
