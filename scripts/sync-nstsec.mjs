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
const catalog=JSON.parse(await readFile(resolve(root,'src/content/oscp-tool-catalog.json'),'utf8'));
const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const escapeHTML=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const tools=[];
for(const [group,name,url,aliases,note=''] of catalog){
 const regex=new RegExp('(?<![a-z0-9_])(?:'+aliases.split(',').map(escapeRegex).join('|')+')(?=\\b|$)','i');
 const mentions=[];
 for(const page of pages){
  const visible=page.html.replace(/<[^>]+>/g,' ');
  const sourceLinks=[...page.html.matchAll(/href="(https?:[^"]+)"/g)].map(m=>m[1]).join(' ');
  const code=[...page.html.matchAll(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)].map(m=>m[1].replace(/<[^>]+>/g,' ')).join('\n');
  const evidence=group==='Built-in utilities and runtimes'?code:visible+' '+sourceLinks;
  if(!regex.test(evidence))continue;
  const heading=page.headings.find(h=>regex.test(h.text))?.slug;
  mentions.push({title:page.title,url:page.url+(heading?'#'+heading:'')});
 }
 if(mentions.length)tools.push({group,name,url,mentions,aliases,note});
}
let toolMarkdown='# Tools and resources\n\nFind a tool’s project or documentation, then open the notes that use it. Built-in commands and related scripts are grouped under their parent toolkit.\n\nLinks identify tools mentioned in these notes; they are not an exam-permission list. Legacy names are kept so older examples remain searchable.\n';
for(const group of [...new Set(tools.map(t=>t.group))]){
 toolMarkdown+='\n## '+group+'\n\n| Tool / project or documentation | Mentioned in |\n| --- | --- |\n';
 for(const tool of tools.filter(t=>t.group===group).sort((a,b)=>a.name.localeCompare(b.name))){
  const refs=tool.mentions.map(m=>'<a href="'+escapeHTML(m.url)+'">'+escapeHTML(m.title)+'</a>');
  const links=refs.length>3?'<details><summary>'+refs.length+' pages</summary>'+refs.join('<br>')+'</details>':refs.join('<br>');
  const aliases=tool.aliases.split(',');
  const names=aliases.length>1?'<br><small class="tool-aliases">'+aliases.map(escapeHTML).join(' · ')+'</small>':'';
  const note=tool.note?'<br><small class="tool-aliases">'+escapeHTML(tool.note)+'</small>':'';
  toolMarkdown+='| ['+tool.name+']('+tool.url+')'+names+note+' | '+links+' |\n';
 }
}
const renderedTools=await processor.render(toolMarkdown);
pages.push({depth:0,title:'Tools and resources',path:'tools.md',slug:'tools',url:'/oscp/nstsec/tools/',html:renderedTools.code,headings:renderedTools.metadata.headings});
await writeFile(resolve(root,'src/content/oscp-nstsec.snapshot.json'),JSON.stringify({source:'https://github.com/Astaruf/OSCP-notes',revision:'f6917994cbca3d2470f744962f84b30bc545e31e',pages,assets,tools})+'\n');
console.log(`Indexed ${tools.length} tools / families across ${pages.length-1} source pages`);
console.log(`Prepared ${pages.length} pages and ${assets.length} assets`);
