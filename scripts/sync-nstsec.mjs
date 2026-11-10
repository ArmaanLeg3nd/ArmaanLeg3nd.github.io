// Snapshot the locally reviewed source; builds need no vault or network access.
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
const source=resolve(process.argv[2]||'');
if(!process.argv[2])throw new Error('Provide the reviewed NSTSec checkout');
const root=fileURLToPath(new URL('../',import.meta.url));
const summary=await readFile(resolve(source,'SUMMARY.md'),'utf8');
const entries=[...summary.matchAll(/^([ \t]*)\* \[([^\]]+)\]\(([^)]+)\)/gm)].filter(m=>m[3]!=='README.md').map(m=>({depth:m[1].length?1:0,title:m[2],path:m[3]}));
const slug=path=>path.replace(/(?:^|\/)README\.md$/,'').replace(/\.md$/,'').replace(/\/$/,'');
const route=path=>'/oscp/nstsec/'+(slug(path)?slug(path)+'/':'');
const paths=new Set(entries.map(e=>e.path));
const processor=await createMarkdownProcessor({syntaxHighlight:false,smartypants:false});
const assets=[];
for(const file of await readdir(resolve(source,'.gitbook/assets'))){
 const target=resolve(root,'public/oscp/nstsec/assets',file);await mkdir(dirname(target),{recursive:true});await copyFile(resolve(source,'.gitbook/assets',file),target);assets.push(file);
}
const rebase=(target,path)=>{
 if(target.startsWith('#')||/^(?:[a-z]+:|\/\/)/i.test(target))return target;
 const url=new URL(target,'https://local.invalid/'+path), dest=decodeURIComponent(url.pathname.slice(1));
 if(paths.has(dest))return route(dest)+url.hash;
 if(dest==='README.md'||dest==='WORKING-INDEX.md')return '/oscp/nstsec/';
 if(dest.startsWith('.gitbook/assets/'))return '/oscp/nstsec/assets/'+encodeURIComponent(dest.slice(16))+url.hash;
 return 'https://github.com/Astaruf/OSCP-notes/blob/main/'+dest+url.hash;
};
const pages=[];
for(const entry of entries){
 let fence=false;
 let md=(await readFile(resolve(source,entry.path),'utf8')).replace(/\r\n/g,'\n').split('\n').map(line=>{
  if(/^\s*(`{3,}|~{3,})/.test(line)){fence=!fence;return line;}
  if(fence)return line;
  line=line.replace(/\{%\s*embed url="([^"]+)"\s*%\}/g,'[Open resource]($1)').replace(/\{%\s*file src="([^"]+)"\s*%\}/g,'[Source attachment]($1)').replace(/\{%\s*code title="([^"]+)"\s*%\}/g,'**$1**').replace(/\{%\s*hint style="([^"]+)"\s*%\}/g,'> **Note:**').replace(/\{%\s*end(?:hint|embed|code)\s*%\}/g,'');
  line=line.replace(/(!?)\[([^\]]*)\]\(([^)]+)\)/g,(_,image,label,url)=>image+'['+label+']('+rebase(url,entry.path)+')');
  return line.replace(/(href|src)="([^"]+)"/g,(_,attr,url)=>attr+'="'+rebase(url,entry.path)+'"');
 }).join('\n');
 const rendered=await processor.render(md);
 if(/<(?:script|iframe|object|embed|style|form|input)\b|<[^>]+\son\w+\s*=|<[^>]+(?:href|src)=["']\s*(?:javascript|data):/i.test(rendered.code))throw new Error('Active markup: '+entry.path);
 pages.push({...entry,slug:slug(entry.path),url:route(entry.path),html:rendered.code,headings:rendered.metadata.headings});
}
await writeFile(resolve(root,'src/content/oscp-nstsec.snapshot.json'),JSON.stringify({source:'https://github.com/Astaruf/OSCP-notes',revision:'f6917994cbca3d2470f744962f84b30bc545e31e',pages,assets})+'\n');
console.log(`Prepared ${pages.length} pages and ${assets.length} assets`);
