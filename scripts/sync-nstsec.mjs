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
 if(target.startsWith('#')||target.startsWith('/')||/^(?:[a-z]+:|\/\/)/i.test(target))return target;
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
const catalog=JSON.parse(await readFile(resolve(root,'src/content/oscp-tool-catalog.json'),'utf8'));
const extras=JSON.parse(await readFile(resolve(root,'src/content/oscp-extra-tools.json'),'utf8'));
const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const escapeHTML=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const tools=[];
for(const [group,name,url,aliases] of catalog){
 if(!extras.tools.includes(name))continue;
 const regex=new RegExp('(?<![a-z0-9_])(?:'+aliases.split(',').map(escapeRegex).join('|')+')(?=\\b|$)','i');
 const canonical=new URL(url);
 const matchesSource=link=>{
  const actual=new URL(link.replaceAll('&amp;','&'));
  const base=canonical.pathname.replace(/\/$/,'').toLowerCase();
  const path=actual.pathname.replace(/\/$/,'').toLowerCase();
  return actual.hostname.toLowerCase()===canonical.hostname.toLowerCase()&&(path===base||path.startsWith(base+'/'));
 };
 const mentions=[];
 for(const page of pages){
  const sourceLinks=[...new Set([...page.html.matchAll(/href="(https?:[^"]+)"/g)].map(m=>m[1]).filter(matchesSource))];
  if(!sourceLinks.length)continue;
  const heading=page.headings.find(h=>regex.test(h.text))?.slug;
  mentions.push({title:page.title,url:page.url+(heading?'#'+heading:''),sources:sourceLinks});
 }
 if(mentions.length)tools.push({group,name,url:mentions[0].sources[0],mentions});
}
let toolMarkdown='# Extra tools to obtain\n\nExtra tool links collected from the individual track pages. Open the linked notes for setup, commands and when to use each tool. Standard Kali commands and built-in utilities are omitted.\n';
let track='';const tracks=new Map();
for(const page of pages){if(!page.depth){track=page.title;tracks.set(track,[]);}tracks.get(track)?.push(page.url);}
for(const [track,urls] of tracks){
 const selected=tools.filter(t=>t.mentions.some(m=>urls.includes(m.url.split('#')[0])));
 if(!selected.length)continue;
 toolMarkdown+='\n## '+track+'\n\n| Tool links | Used in this track |\n| --- | --- |\n';
 for(const tool of selected.sort((a,b)=>a.name.localeCompare(b.name))){
  const refs=tool.mentions.filter(m=>urls.includes(m.url.split('#')[0])).map(m=>'<a href="'+escapeHTML(m.url)+'">'+escapeHTML(m.title)+'</a>');
  const links=refs.length>3?'<details><summary>'+refs.length+' pages</summary>'+refs.join('<br>')+'</details>':refs.join('<br>');
  const sources=[...new Set(tool.mentions.filter(m=>urls.includes(m.url.split('#')[0])).flatMap(m=>m.sources))];
  const sourceLinks=sources.map((url,index)=>'<a href="'+escapeHTML(url.replaceAll('&amp;','&'))+'">'+escapeHTML(index?tool.name+' — source '+(index+1):tool.name)+'</a>').join('<br>');
  toolMarkdown+='| '+sourceLinks+' | '+links+' |\n';
 }
}
const renderedTools=await processor.render(toolMarkdown);
pages.push({depth:0,title:'Extra tools to obtain',path:'tools.md',slug:'tools',url:'/oscp/nstsec/tools/',html:renderedTools.code,headings:renderedTools.metadata.headings});
await writeFile(resolve(root,'src/content/oscp-nstsec.snapshot.json'),JSON.stringify({source:'https://github.com/Astaruf/OSCP-notes',revision:'f6917994cbca3d2470f744962f84b30bc545e31e',pages,assets,tools})+'\n');
console.log(`Indexed ${tools.length} tools / families across ${pages.length-1} source pages`);
console.log(`Prepared ${pages.length} pages and ${assets.length} assets`);
