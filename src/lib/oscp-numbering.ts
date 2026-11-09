import stable from '../content/oscp-section-numbers.json' with {type:'json'};
import {goalLabel} from './oscp-goals.ts';
import snapshot from '../content/oscp-plain.snapshot.json' with {type:'json'};
import methods from '../content/oscp.snapshot.json' with {type:'json'};

type Page=typeof snapshot.pages[number];
export interface SectionHeading {depth:number;slug:string;text:string;number:string}
export const chapters:Record<string,string>={
 '0':'Start and shared concepts','1':'Surface to opportunity','2':'Web behavior to access',
 '3':'Credentials and keys','4':'Public exploits and reliable sessions','5':'Local privilege escalation',
 '6':'Active Directory','7':'Payload execution and troubleshooting','8':'Integrated attacks and evidence',
 '9':'Operational procedures','10':'Cheatsheets',
 '9.1':'Discovery and scanning','9.2':'Service enumeration','9.3':'Initial access',
 '9.4':'Shells, transfers and credentials','9.5':'Local privilege escalation',
 '9.6':'AD and lateral movement','9.7':'Pivoting and tunneling','9.8':'Evidence and reporting'
};
const topicCodes:Record<string,string>={
 discovery:'1.1',services:'1.2','web-mapping':'2.1','web-exploitation':'2.2',
 credentials:'3.1','public-exploits':'4.1','sessions-transfers':'4.2',
 'linux-privesc':'5.1','windows-privesc':'5.2',pivoting:'6.1.3','ad-mapping':'6.2.9',
 'ad-identities':'6.3.11','lateral-movement':'6.4.4',execution:'7.1',integration:'8.1'
};
const shared:Record<string,string>={
 'README.md':'0.0','notes/Master_Notes.md':'0.1','notes/Attack_Strategy_Map.md':'0.2',
 'notes/Speedrun_Breakdown.md':'0.3','notes/Recognition_Practice.md':'0.4','notes/GetSH_Coverage.md':'0.5',
 'notes/Attack_Surface_Maps.md':'0.6','notes/Attack_Surface_Supplements.md':'0.7'
};
export function cleanTitle(title:string){return title.replace(/^\d+(?:\.\d+)*[.)]?\s+/,'');}
const ad=new Map(snapshot.sections.map(s=>[s.path,s]));
function rawDescribe(page:Page) {
 const section=ad.get(page.path);
 if(section)return {number:section.number,title:goalLabel(section.title),authored:true};
 if(shared[page.path])return {number:shared[page.path],title:cleanTitle(page.title),authored:false};
 if(page.path.startsWith('notes/methods/')) {
   const topic=page.path.split('/').at(-1)!.replace('.md','');
   return {number:topicCodes[topic],title:cleanTitle(page.title),authored:false};
 }
 if(page.path in stable)return {number:stable[page.path as keyof typeof stable].number,title:cleanTitle(page.title),authored:false};
 if(page.path.startsWith('cheatsheets/'))throw new Error('Assign an explicit workflow number for '+page.path);
 const stage=page.path.match(/^reference\/(\d+)-/);
 if(stage) {
   const file=page.path.split('/').at(-1)!;
   const ordinal=file==='README.md'?0:Number(file.match(/^(\d+)/)?.[1]||90);
   return {number:'9.'+Number(stage[1])+'.'+ordinal,title:cleanTitle(page.title),authored:false};
 }
 return {number:'9.0',title:cleanTitle(page.title),authored:false};
}
export function describe(page:Page){const item=rawDescribe(page);return {...item,title:goalLabel(item.title)};}
export function escape(text:string){return text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
const url=(page:Page)=>'/oscp/'+(page.slug?page.slug+'/':'');
const methodById=new Map(methods.methods.map(m=>[m.id,m]));
export function methodDestination(id:string) {
 const method=methodById.get(id);if(!method)throw new Error('Unknown receiving method '+id);
 const page=snapshot.pages.find(p=>p.path==='notes/methods/'+method.topic+'.md');
 if(!page)throw new Error('Missing receiving guide '+id);
 const alias=page.markdown.indexOf('<a id="'+id+'"></a>');
 if(alias<0)throw new Error('Missing method anchor '+id);
 const before=page.markdown.slice(0,alias);
 const next=page.markdown.slice(alias).match(/^## (.+)$/m)?.[1];
 const index=[...before.replace(/\x60{3}[\s\S]*?\x60{3}/g,'').matchAll(/^## /gm)].length+1;
 return {number:describe(page).number+'.'+index,title:next||method.title,url:url(page)+'#'+id};
}

export function resultRoutes(html:string,page:Page) {
 const topic=page.path.match(/^notes\/methods\/([^/]+)\.md$/)?.[1];
 if(!topic)return html;
 const candidates=methods.methods.filter(m=>m.topic===topic);
 return html.replace(/<h3 id="([^"]*next-transitions[^"]*)">([\s\S]*?)<\/h3>([\s\S]*?)(?=(?:<p>)?<a id=|<h[12]\b|$)/g,
 (all,anchor,_title,_body,offset:number)=>{
   const preceding=html.slice(0,offset);
   const current=candidates.map(m=>({method:m,position:preceding.lastIndexOf('<a id="'+m.id+'"')})).filter(x=>x.position>=0).sort((a,b)=>b.position-a.position)[0]?.method;
   if(!current)return all;
   const rows=current.next.map(edge=>{
     const target=methodDestination(edge.id);
     return '<tr><td>'+escape(edge.when)+'</td><td>'+escape(edge.requires)+'</td><td><a href="'+target.url+'">§'+target.number+' — '+escape(target.title)+'</a></td></tr>';
   }).join('');
   return '<h3 id="'+anchor+'">Continue from the interpreted result</h3><table data-result-routes="'+current.id+'"><thead><tr><th>Observed result</th><th>Check before proceeding</th><th>Next numbered section</th></tr></thead><tbody>'+rows+'</tbody></table>\n';
 });
}

export function numberMarkup(html:string,page:Page,original:Array<{depth:number;slug:string;text:string}>) {
 const descriptor=describe(page);
 const headings:SectionHeading[]=[];
 const counters=Array(7).fill(0);
 const details:number[]=[];
 const legacy=(stable as Record<string,{legacyNumber?:string}>)[page.path]?.legacyNumber;
 const variantSlug=(number:string)=>'variant-'+(legacy?legacy+number.slice(descriptor.number.length):number).replaceAll('.','-');
 let depth=1,headingPosition=0,zeroParent=false;
 const next=(level:number)=>{
   if(level===1)return descriptor.number;
   for(let i=2;i<level;i++)if(!counters[i]&&!(i===2&&zeroParent))counters[i]=1;
   counters[level]++;
   for(let i=level+1;i<counters.length;i++)counters[i]=0;
   return descriptor.number+'.'+counters.slice(2,level+1).join('.');
 };
 html=html.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>|<details\b[^>]*>|<\/details>|<summary([^>]*)>([\s\S]*?)<\/summary>|<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g,
 (all,level,attrs,inner,summaryAttrs,summaryInner,codeAttrs,codeBody)=>{
   if(codeBody!==undefined) {
     if(!/language-(?:bash|sh|shell|powershell|cmd|bat)\b/.test(codeAttrs))return all;
     const chunks=codeBody.split(/\n\n(?=(?:#\s|REM\s))/i);
     if(chunks.length<2)return all;
     const child=Math.min(depth+1,6);
     return chunks.map((chunk:string)=>{
       const number=next(child),slug=variantSlug(number);
       const title=chunk.split('\n')[0].replace(/^(?:#|REM)\s*/i,'');
       headings.push({depth:child,slug,text:number+' '+title,number});
       return '<h'+child+' id="'+slug+'">'+number+' '+title+'</h'+child+'><pre><code'+codeAttrs+'>'+chunk+'</code></pre>';
     }).join('\n');
   }
   if(all.startsWith('<details')){details.push(depth);return all;}
   if(all==='</details>'){depth=details.pop()||depth;return all;}
   if(level) {
     const old=original[headingPosition++];
     if(!old)throw new Error('Heading metadata mismatch: '+page.path);
     depth=Number(level);
     const authoredNumber=old.text.match(/^\d+(?:\.\d+)*/)?.[0];
     const fixed=(stable as Record<string,{headings:Record<string,string>}>)[page.path]?.headings[old.slug];
     const number=fixed || (authoredNumber&&authoredNumber.startsWith(descriptor.number+'.')?authoredNumber:descriptor.authored&&authoredNumber?authoredNumber:next(depth));
     zeroParent=number.startsWith(descriptor.number+'.0');
     if(number.startsWith(descriptor.number+'.')) {
       const parts=number.slice(descriptor.number.length+1).split('.').map(Number);
       for(let i=2;i<counters.length;i++)counters[i]=parts[i-2]||0;
     }
     const text=descriptor.authored?old.text:number+' '+cleanTitle(old.text.includes('Next transitions')?'Continue from the interpreted result':old.text);
     headings.push({depth,slug:old.slug,text,number});
     const alias='s-'+number.replaceAll('.','-');
     const aliasMarkup=html.includes('id="'+alias+'"')?'':'<a id="'+alias+'"></a>';
     return aliasMarkup+'<h'+level+attrs+'>'+(descriptor.authored?inner:number+' '+inner.replace(/^\d+(?:\.\d+)*[.)]?\s+/,''))+'</h'+level+'>';
   }
   const variantDepth=Math.min(depth+1,6);
   const number=next(variantDepth);
   const title=summaryInner.replace(/^\s*<(?:strong|b)>/,'').replace(/<\/(?:strong|b)>\s*$/,'').replace(/^\d+(?:\.\d+)*[.)]?\s+/,'');
   const slug=variantSlug(number);
   headings.push({depth:variantDepth,slug,text:number+' '+title.replace(/<[^>]*>/g,''),number});
   return '<summary'+summaryAttrs+' id="'+slug+'">'+number+' '+title+'</summary>';
 });
 if(legacy&&legacy!==descriptor.number){const prefix='s-'+descriptor.number.replaceAll('.','-');html=html.replace(/id="(s-[0-9-]+)"/g,(all,id)=>{if(id===prefix||id.startsWith(prefix+'-')){const old='s-'+legacy.replaceAll('.','-')+id.slice(prefix.length);if(!html.includes('id="'+old+'"'))return all+' data-legacy-anchor="'+old+'"';}return all;});html=html.replace(/(<a id="[^"]+" data-legacy-anchor="([^"]+)"[^>]*><\/a>)/g,'<a id="$2"></a>$1');}
 return {html,headings};
}
