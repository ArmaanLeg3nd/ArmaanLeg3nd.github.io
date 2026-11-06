export interface SearchEntry {number:string;title:string;url:string;text:string;kind?:'Quick command'|'Procedure'|'Explanation'|'Helper definition';topic?:string}
export function searchReference(entries:SearchEntry[],query:string,limit=10,context="") {
 const phrase=query.trim().toLowerCase();
 if(!phrase||phrase.length>160)return [];
 const terms=phrase.split(/\s+/).filter(Boolean);
 return entries.map(entry=>{
   const title=entry.title.toLowerCase(),text=(title+' '+entry.text).toLowerCase();
   if(!terms.every(term=>text.includes(term)))return {entry,score:0};
   const number=entry.number.toLowerCase();
   let score=number===phrase?1000:number.startsWith(phrase+'.')?800:title===phrase?700:title.includes(phrase)?600:100;
   score+=(text.includes(phrase)?40:0)+Math.max(0,20-Math.floor(entry.text.length/250));
   if(context&&entry.topic===context)score+=80;
   score+=entry.kind==='Quick command'?25:entry.kind==='Procedure'?15:0;
   score+=terms.filter(term=>title.includes(term)).length*30;
   return {entry,score};
 }).filter(result=>result.score>0).sort((a,b)=>b.score-a.score||a.entry.number.localeCompare(b.entry.number,undefined,{numeric:true})).slice(0,limit).map(result=>result.entry);
}
export function validNavigationState(value:unknown) {
 if(!value||typeof value!=='object')return {open:{} as Record<string,boolean>,left:0,right:{} as Record<string,number>};
 const x=value as Record<string,unknown>,open:Record<string,boolean>={},right:Record<string,number>={};
 if(x.open&&typeof x.open==='object')for(const [key,v] of Object.entries(x.open).slice(0,250))if(/^\d+(?:\.\d+)*$/.test(key)&&typeof v==='boolean')open[key]=v;
 if(x.right&&typeof x.right==='object')for(const [key,v] of Object.entries(x.right).slice(-30))if(key.startsWith('/oscp/')&&typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<1e7)right[key]=v;
 return {open,left:typeof x.left==='number'&&Number.isFinite(x.left)&&x.left>=0?Math.min(x.left,1e7):0,right};
}

export function referenceTopic(url:string){if(/ad-investigation|active-directory|ad-mapping|ad-identities|lateral-movement|06-ad-/.test(url))return 'ad';if(/windows-privesc/.test(url))return 'windows';if(/linux-privesc/.test(url))return 'linux';for(const [topic,pattern] of [['web',/web-|http|wordpress|injection|ssrf/],['credentials',/credential|cracking/],['discovery',/discovery|scanning/],['services',/service-opportun|02-service/],['shells',/shell|transfer|payload/],['pivoting',/pivot|tunnel/],['exploits',/public-exploit/],['evidence',/evidence|report|integration/]] as const)if(pattern.test(url))return topic;return url.split('/').filter(Boolean).slice(0,3).join('/');}
