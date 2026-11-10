const stages=new Set(['kali','linux','windows','configuration','references']);
const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
export function collectToolSetups(sources,tools){
 const expected=new Set(tools.map(t=>t.name)),result=[];
 for(const source of sources){
  for(const match of source.markdown.replace(/\r\n/g,'\n').matchAll(/<!-- tool-setup (\{[^\n]+\}) -->\s*([\s\S]*?)\s*<!-- \/tool-setup -->/g)){
   const meta=JSON.parse(match[1]),body=match[2];
   if(!expected.has(meta.name))throw new Error('Setup has no owning tool link: '+meta.name);
   if(result.some(r=>r.name===meta.name))throw new Error('Duplicate tool setup: '+meta.name);
   if(!stages.has(meta.stage)||!['baseline','optional'].includes(meta.tier))throw new Error('Invalid setup placement: '+meta.name);
   if(!Array.isArray(meta.packages)||meta.packages.some(p=>!/^[-a-z0-9.+]+$/.test(p)))throw new Error('Invalid package metadata: '+meta.name);
   const anchor=body.match(/<a id="(setup-[^"]+)"><\/a>/)?.[1];
   if(!anchor||!(/```(?:bash|powershell|cmd)\n/).test(body))throw new Error('Incomplete setup: '+meta.name);
   const tool=tools.find(t=>t.name===meta.name);
   const usage=tool.mentions?.find(m=>m.url.split('#')[0]===source.url)?.url||source.url;
   result.push({...meta,body,owner:source.url+'#'+anchor,usage,title:source.title});
  }
 }
 for(const name of expected)if(!result.some(r=>r.name===name))throw new Error('Missing tool setup: '+name);
 return result;
}
export function collectToolConfigurations(sources){
 const result=[];
 for(const source of sources){
  for(const match of source.markdown.replace(/\r\n/g,'\n').matchAll(/<!-- tool-config (\{[^\n]+\}) -->\s*([\s\S]*?)\s*<!-- \/tool-config -->/g)){
   const meta=JSON.parse(match[1]),body=match[2],anchor=body.match(/<a id="(config-[^"]+)"><\/a>/)?.[1];
   if(typeof meta.name!=='string'||!meta.name||typeof meta.usage!=='string'||!(/^[a-z0-9][a-z0-9-]*$/).test(meta.usage)||!anchor||!body.includes('```bash'))throw new Error('Incomplete tool configuration: '+source.path);
   const owner=source.url+'#'+anchor;
   if(result.some(r=>r.name===meta.name||r.owner===owner))throw new Error('Duplicate tool configuration: '+meta.name);
   result.push({...meta,body,owner,usage:source.url+'#'+meta.usage,title:source.title});
  }
 }
 return result;
}
export function renderToolSetupPage(template,setups,trackLinks,bundledLinks='',configurations=[]){
 const baseline=setups.filter(s=>s.tier==='baseline');
 const packages=[...new Set(baseline.flatMap(s=>s.packages))];
 const use=s=>`\n\n[Use ${s.name}](${s.usage}) · [Setup source](${s.owner})\n`;
 const entry=(s,open)=>{
  let body=s.body.replace(/<a id="(?:setup|config)-[^"]+"><\/a>/,'');
  if(open){body=body.replace(/^<details>\s*<summary>[\s\S]*?<\/summary>/,'### '+s.name).replace(/<\/details>\s*$/,'');
   if(s.packages.length)body=body.replace(/^sudo apt install [^\n]+\n/gm,'').replace(/```bash\s*```/g,'');
   return body+use(s);
  }
  return body.replace(/<details>/,'<details id="prepare-'+escape(s.owner.split('#')[1])+'">').replace(/<\/details>\s*$/,use(s)+'</details>');
 };
 const sections={
  'baseline-packages':'```bash\nsudo apt install '+packages.join(' ')+'\n```\n\n'+baseline.filter(s=>s.packages.length).map(s=>`[${s.name}](${s.owner})`).join(' · '),
  'baseline-kali':baseline.filter(s=>s.stage==='kali').map(s=>entry(s,true)).join('\n\n'),
  'baseline-linux':baseline.filter(s=>s.stage==='linux').map(s=>entry(s,true)).join('\n\n'),
  'baseline-windows':baseline.filter(s=>s.stage==='windows').map(s=>entry(s,true)).join('\n\n'),
  'optional-setups':[['kali','Kali alternatives'],['linux','Linux alternatives'],['windows','Windows alternatives and builds'],['configuration','Local services and Windows features'],['references','Conditional sources and wordlists']].map(([stage,title])=>{
   const selected=setups.filter(s=>s.tier==='optional'&&s.stage===stage);
   return selected.length?'### '+title+'\n\n'+selected.map(s=>entry(s,false)).join('\n\n'):'';
  }).filter(Boolean).join('\n\n'),
  'track-tool-links':trackLinks,
  'bundled-tool-lookup':bundledLinks,
  'reusable-configurations':configurations.map(s=>entry(s,false)).join('\n\n'),
 };
 for(const [key,value]of Object.entries(sections)){
  const marker='<!-- '+key+' -->';if(template.split(marker).length!==2)throw new Error('Setup template needs exactly one '+marker);
  template=template.replace(marker,value);
 }
 return template;
}
