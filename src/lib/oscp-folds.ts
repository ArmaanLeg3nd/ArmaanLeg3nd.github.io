import review from '../content/oscp-fold-review.json' with {type:'json'};
import methods from '../content/oscp.snapshot.json' with {type:'json'};
import {escape} from './oscp-numbering.ts';

function boundary(html:string,position:number) {
 const before=html.slice(0,position);
 const anchors=before.match(/(?:\s*<a\b[^>]*><\/a>\s*)+$/);
 return anchors?position-anchors[0].length:position;
}
function depth(html:string,position:number){return [...html.slice(0,position).matchAll(/<details\b|<\/details>/g)].reduce((n,m)=>n+(m[0].startsWith('</')?-1:1),0);}
export function foldMethods(html:string,path:string) {
 const policy=(review as Record<string,{choices:string[];methods?:Record<string,string>}>)[path];
 if(!policy)throw new Error('Review disclosure policy for new page: '+path);
 const headings=[...html.matchAll(/<h([2-5])\b[^>]*>[\s\S]*?<\/h\1>/g)];
 const selected:Array<{start:number;end:number;headingStart:number;headingEnd:number;cue:string}>=[];
 for(let i=0;i<headings.length;i++){
  const h=headings[i],headingStart=h.index!,start=boundary(html,headingStart);
  const following=headings.slice(i+1).find(next=>Number(next[1])<=Number(h[1]));
  const end=following?boundary(html,following.index!):html.length;
  const prior=html.slice(Math.max(0,start-300),headingStart);
  const method=methods.methods.find(m=>Number(h[1])===2&&policy.methods?.[m.id]?.startsWith('fold:')&&path==='notes/methods/'+m.topic+'.md'&&prior.includes('id="'+m.id+'"'));
  const title=h[0].replace(/<[^>]*>/g,'').replace(/^\d+(?:\.\d+)*\s+/,'');
  const match=policy.choices.includes(title);
  if(!method&&!match)continue;
  // Do not split a source-authored disclosure or other containing structure.
  if(depth(html,start)!==0||depth(html,end)!==0)continue;
  selected.push({start,end,headingStart,headingEnd:headingStart+h[0].length,
   cue:method?'Choose when: '+method.clue+' · Result: '+method.result:choiceCue(title)});
 }
 const outer=selected.filter(part=>!selected.some(parent=>parent!==part&&parent.start<=part.start&&parent.end>=part.end));
 for(const part of outer.reverse()){
  const heading=html.slice(part.headingStart,part.headingEnd),anchors=html.slice(part.start,part.headingStart);
  const body=html.slice(part.headingEnd,part.end);
  const cue=body.includes('Run/context:')?'':'<span class="method-choice-cue">'+escape(part.cue)+'</span>';
  html=html.slice(0,part.start)+'<details data-method-fold><summary>'+heading+cue+'</summary>'+anchors+body+'</details>'+html.slice(part.end);
 }
 html=html.replace(/<section data-study-approach="([^"]+)" aria-label="([^"]+)">([\s\S]*?)<\/section>/g,(_all,key,label,body)=>'<details data-study-approach="'+key+'"><summary id="approach-'+key+'"><span class="approach-heading">'+label+'</span><span class="method-choice-cue">'+escape(choiceCue(label))+'</span></summary>'+body+'</details>');
 return html;
}

function choiceCue(title:string){
 if(/Native Windows|Native \/ RSAT/.test(title))return 'Windows context: native commands first; RSAT only when installed.';
 if(/ADSI/.test(title))return 'Windows/.NET directory queries without RSAT; use the current network identity and correct base.';
 if(/LDAP/.test(title))return 'Directory connectivity and a supported authenticated query context; check base, filter and paging.';
 if(/PowerView/.test(title))return 'Reviewed compatible PowerView loaded in the intended directory authentication context.';
 if(/OpenSSH/.test(title))return 'Choose local, remote or dynamic forwarding by the SSH endpoint and required listener direction.';
 if(/Chisel/.test(title))return 'Choose the forwarding direction matching the reachable server and desired listener.';
 if(/Ligolo/.test(title))return 'Use an established agent/proxy route when routed subnet access is needed.';
 if(/^(?:Windows|Windows forwarding alternatives)$/.test(title))return 'Windows built-in forwarding; check listener, routing and administrative prerequisites.';
 if(/sshuttle/.test(title))return 'Transparent TCP forwarding through an authorized SSH endpoint with its runtime prerequisites.';
 if(/Socat/.test(title))return 'Fixed TCP relay: select the reachable listener and destination explicitly.';
 if(/Sudo|sudo/.test(title))return 'Inspect the allowed run-as identity, exact command, arguments and restrictions before selecting a sudo path.';
 if(/SUID|SGID|capabilit/.test(title))return 'A privileged executable or capability is a candidate; verify its exact operation and execution context.';
 if(/Cron|timers|Scheduled|autostart|startup/.test(title))return 'Check the privileged consumer, controlled input and actual schedule or trigger.';
 if(/PATH|relative-command|Wildcard|option injection/.test(title))return 'Prove the privileged consumer uses the controlled name, expansion or search path.';
 if(/service|Service/.test(title))return 'Verify the selected service identity, effective control and required trigger; reachability alone is insufficient.';
 if(/kernel|Software|driver/.test(title))return 'Use a matching affected build/configuration only after stronger permission-backed candidates have been assessed.';
 if(/Hashcat|John/.test(title))return 'Use the identified verifier format and a feasible offline candidate strategy.';
 if(/SCP|SSH/.test(title))return 'Requires the correct identity/key context and a reachable SSH service.';
 return 'Check this approach’s stated access/configuration prerequisites and decisive verification before choosing it.';
}
