import {searchReference,referenceTopic,validNavigationState,type SearchEntry} from '../lib/oscp-plain-search.ts';
const left=document.querySelector<HTMLElement>('#reference-index');
const right=document.querySelector<HTMLElement>('#page-index');
const key='oscp-reference-navigation-v1';
let state=validNavigationState(null);
try{state=validNavigationState(JSON.parse(sessionStorage.getItem(key)||'null'));}catch{}
const disclosures=[...document.querySelectorAll<HTMLDetailsElement>('article details')];
const controls=document.querySelector<HTMLElement>('.method-controls');
if(controls&&disclosures.length){controls.hidden=false;controls.addEventListener('click',event=>{const action=(event.target as Element).closest<HTMLElement>('[data-disclosure-action]')?.dataset.disclosureAction;if(!action)return;for(const d of disclosures)d.open=action==='expand';});}
let printState:boolean[]=[];
window.addEventListener('beforeprint',()=>{printState=disclosures.map(d=>d.open);for(const d of disclosures)d.open=true;});
window.addEventListener('afterprint',()=>disclosures.forEach((d,i)=>d.open=printState[i]??d.open));
if(left&&right) {
 const folders=[...left.querySelectorAll<HTMLDetailsElement>('details[data-section]')];
 for(const folder of folders) {
   const id=folder.dataset.section!;
   if(id in state.open&&!folder.querySelector('[aria-current="page"]'))folder.open=state.open[id];
 }
 left.scrollTop=state.left;right.scrollTop=state.right[location.pathname]||0;
 const save=()=>{
   for(const folder of folders)state.open[folder.dataset.section!]=folder.open;
   state.left=left.scrollTop;state.right[location.pathname]=right.scrollTop;
   state=validNavigationState(state);
   try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}
 };
 window.addEventListener('pagehide',save);
 for(const folder of folders)folder.addEventListener('toggle',save);
 let saving=false;
 const schedule=()=>{if(!saving){saving=true;requestAnimationFrame(()=>{save();saving=false;});}};
 left.addEventListener('scroll',schedule,{passive:true});right.addEventListener('scroll',schedule,{passive:true});
 const links=[...right.querySelectorAll<HTMLAnchorElement>('a[href*="#"]')];
 const targets=links.map(a=>({a,node:document.getElementById(decodeURIComponent(new URL(a.href).hash.slice(1)))})).filter(x=>x.node);
 const reveal=()=>{
   const node=document.getElementById(decodeURIComponent(location.hash.slice(1)));let parent=node?.closest('details');
   while(parent){parent.open=true;parent=parent.parentElement?.closest('details')||null;}
   if(node)requestAnimationFrame(()=>node.scrollIntoView({block:'start'}));
 };
 document.addEventListener('click',event=>{
   const anchor=(event.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
   if(!anchor||new URL(anchor.href).pathname!==location.pathname)return;
   const target=document.getElementById(decodeURIComponent(new URL(anchor.href).hash.slice(1)));
   let parent=target?.closest('details');while(parent){parent.open=true;parent=parent.parentElement?.closest('details')||null;}
 });
 window.addEventListener('hashchange',reveal);reveal();
 let painting=false;
 const mark=()=>{painting=false;const offset=matchMedia('(max-width:760px)').matches?right.getBoundingClientRect().bottom+32:40;
   let active=targets.find(t=>t.node!.getClientRects().length)?.a;
   for(const item of targets)if(item.node!.getClientRects().length&&item.node!.getBoundingClientRect().top<=offset)active=item.a;
   for(const branch of right.querySelectorAll<HTMLDetailsElement>('details[data-page-branch]'))branch.open=!!active&&branch.contains(active);
   for(const {a} of targets)if(a===active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
 };
 window.addEventListener('scroll',()=>{if(!painting){painting=true;requestAnimationFrame(mark);}},{passive:true});
 window.addEventListener('resize',mark);mark();
}
const form=document.querySelector<HTMLFormElement>('#reference-search');
const input=document.querySelector<HTMLInputElement>('#reference-query');
const results=document.querySelector<HTMLOListElement>('#reference-results');
const status=document.querySelector<HTMLElement>('#reference-search-status');
let index:Promise<SearchEntry[]>|undefined,request=0;
if(form&&input&&results&&status) {
 const run=async()=>{
   const token=++request,query=input.value.trim();
   results.replaceChildren();results.hidden=true;
   if(!query){status.textContent='';return;}
   if(query.length>160){status.textContent='Use a shorter query.';return;}
   status.textContent='Finding sections…';
   try {
     index ||= fetch('/oscp/search.json').then(response=>{if(!response.ok)throw new Error('Search unavailable');return response.json();});
     const matches=searchReference(await index,query,10,referenceTopic(location.pathname));
     if(token!==request)return;
     for(const entry of matches){const li=document.createElement('li'),a=document.createElement('a');a.href=entry.url;a.textContent=(entry.kind?'['+entry.kind+'] ':'')+entry.title;li.append(a);results.append(li);}
     results.hidden=matches.length===0;status.textContent=matches.length?matches.length+' matching sections':'No matching section. Try a field, tool, error or section number.';
   }catch{index=undefined;if(token===request)status.textContent='Search is unavailable. Use the chapter index or your browser’s Find command.';}
 };
 form.addEventListener('submit',event=>{event.preventDefault();void run();});
 let timer:ReturnType<typeof setTimeout>;
 input.addEventListener('input',()=>{++request;clearTimeout(timer);if(!input.value.trim()){results.replaceChildren();results.hidden=true;status.textContent='';return;}timer=setTimeout(()=>void run(),180);});
}
