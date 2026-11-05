import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {plainPages,plainURL,renderPlain,renderIndex,localTarget} from '../src/lib/oscp-plain.ts';

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
    for(const block of blocks(page.markdown))assert.ok(code.includes(block.trimEnd()),page.path+': command preservation');
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
