import snapshot from '../content/oscp-plain.snapshot.json' with {type:'json'};
import methods from '../content/oscp.snapshot.json' with {type:'json'};
import {escape} from './oscp-numbering.ts';

interface HtmlNode {type:string;tagName?:string;value?:string;children?:HtmlNode[];properties?:Record<string,unknown>}
const aliases:Record<string,string[]>={spn:['SPN','SPNs'],sid:['SID','SIDs'],ace:['ACE','ACEs'],dacl:['DACL','DACLs'],tgt:['TGT','TGTs'],kdc:['KDC','KDCs'],'service-ticket':['service ticket','service tickets']};
export function glossaryLinks() {
 return (tree:unknown)=>{
   const linked=new Set<string>();let count=0;
   const terms=snapshot.learning.terms.flatMap(term=>(aliases[term.id]||[term.label]).map(label=>({term,label}))).sort((a,b)=>b.label.length-a.label.length);
   const pattern=new RegExp('\\b('+terms.map(t=>t.label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')\\b','gi');
   const visit=(node:HtmlNode,skip=false)=>{
     if(skip||!node.children)return;
     const excluded=/^(?:a|pre|code|script|style|noscript|summary|h[1-6])$/.test(node.tagName||'');
     if(excluded)return;
     const next:HtmlNode[]=[];
     for(const child of node.children) {
       if(child.type!=='text'||!child.value||count>=12){visit(child);next.push(child);continue;}
       const value=child.value;let start=0;const parts:HtmlNode[]=[];
       for(const match of value.matchAll(pattern)) {
         const selected=terms.find(t=>t.label.toLowerCase()===match[0].toLowerCase())?.term;
         if(!selected||linked.has(selected.id)||count>=12)continue;
         const index=match.index!;
         if(index>start)parts.push({type:'text',value:value.slice(start,index)});
         parts.push({type:'element',tagName:'a',properties:{href:selected.url,title:selected.definition,className:['glossary-term']},children:[{type:'text',value:match[0]}]});
         start=index+match[0].length;linked.add(selected.id);count++;
       }
       if(parts.length){if(start<value.length)parts.push({type:'text',value:value.slice(start)});next.push(...parts);}else next.push(child);
     }
     node.children=next;
   };
   visit(tree as HtmlNode);
 };
}
const effects:Record<string,string>={
 discovery:'Network probes and local output files.',
 services:'Service queries; optional file-write or execution variants can change target state.',
 'web-mapping':'HTTP requests; selected authenticated application actions can change application state.',
 'web-exploitation':'Active weakness validation/exploitation; the selected primitive may read, write or execute.',
 credentials:'Credential processing and selected authentication; online guessing can affect lockout state.',
 'public-exploits':'Inspection/adaptation followed by active exploitation only when its prerequisites are met.',
 'sessions-transfers':'May create sessions, execute commands or transfer files.',
 'linux-privesc':'Includes enumeration and permission-backed privileged execution; distinguish the selected step.',
 'windows-privesc':'Includes enumeration and permission-backed privileged execution; distinguish the selected step.',
 'ad-mapping':'Directory reads and selected host/session collection; collection causes network activity.',
 'ad-identities':'May request tickets, collect sensitive material or change directory state; use the exact selected procedure.',
 'lateral-movement':'Remote authentication/execution; service/file mechanisms can change target state.',
 pivoting:'May start listeners and change routing/forwarding state.',
 execution:'May deliver files, execute payloads or create sessions.',
 integration:'Tracks evidence and selects operations; underlying linked operations retain their own effects.'
};
export function methodContext(html:string,path:string) {
 const topic=path.match(/^notes\/methods\/([^/]+)\.md$/)?.[1];
 if(!topic)return html;
 const entries=methods.methods.filter(m=>m.topic===topic).map(method=>({method,start:html.indexOf('<a id="'+method.id+'"')})).filter(x=>x.start>=0).sort((a,b)=>a.start-b.start);
 for(let i=entries.length-1;i>=0;i--) {
   const {method,start}=entries[i];const end=i+1<entries.length?entries[i+1].start:html.length;
   const part=html.slice(start,end);const code=part.indexOf('<pre');
   if(code<0)continue;
   const panel='<p data-access-context="'+method.id+'"><strong>Access/context:</strong> '+escape(method.access)+'</p><details data-command-context="'+method.id+'"><summary>Conditions, effects and verification</summary><p><strong>Requires:</strong> '+escape(method.conditions)+'</p><p><strong>Action class:</strong> '+escape(effects[topic]||'Use the selected operation and its stated prerequisites.')+'</p><p><strong>Stop/verify:</strong> '+escape(method.verify)+'</p><p><strong>Failure/next check:</strong> '+escape(method.failure)+'</p></details>';
   html=html.slice(0,start+code)+panel+html.slice(start+code);
 }
 return html;
}
