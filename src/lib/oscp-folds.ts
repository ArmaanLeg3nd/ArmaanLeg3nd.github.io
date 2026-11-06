import methods from '../content/oscp.snapshot.json' with {type:'json'};
import {escape} from './oscp-numbering.ts';

// Reviewed alternatives. Foundations, validation steps and workflows stay visible.
const alternatives = new Set([
 'transfer-http','transfer-scp','transfer-smb','transfer-stream','transfer-text','transfer-ftp',
 'session-reverse','session-bind','session-windows',
 'linux-sudo','linux-preload','linux-suid','linux-capabilities','linux-jobs','linux-path','linux-wildcard','linux-library','linux-containers','linux-mounts','linux-kernel',
 'windows-service-config','windows-service-binary','windows-unquoted','windows-dll','windows-tasks','windows-installer','windows-token','windows-backup','windows-kernel',
 'ad-lsass','ad-sam','ad-security','ad-dpapi','ad-ntds','ad-password-reset','ad-group-control','ad-owner-dacl',
 'move-services','move-smbexec','move-tasks','move-wmi','move-dcom','move-winrm','move-rdp',
 'ssh-local','ssh-dynamic','ssh-remote','ssh-remote-dynamic','sshuttle-route','windows-forward','chisel-reverse','chisel-forward','ligolo-route',
 'web-traversal','web-php-source','web-lfi-log','sql-union','sql-blind','sql-oob'
]);
const pages:Record<string,RegExp>={
 'reference/06-ad-lateral-movement/01-domain-mapping.md':/^(?:Native Windows baseline|Built-in ADSI\/DirectorySearcher fallback|Authenticated LDAP from Kali|PowerView)/,
 'cheatsheets/pivoting.md':/^(?:Socat fixed TCP relay|OpenSSH|sshuttle|Windows|Chisel|Ligolo-ng)$/,
 'cheatsheets/active-directory.md':/^(?:Native \/ RSAT \/ ADSI|Authenticated LDAP|PowerView)$/
};
function boundary(html:string,position:number) {
 const before=html.slice(0,position);
 const anchors=before.match(/(?:\s*<a\b[^>]*><\/a>\s*)+$/);
 return anchors?position-anchors[0].length:position;
}
function depth(html:string,position:number){return [...html.slice(0,position).matchAll(/<details\b|<\/details>/g)].reduce((n,m)=>n+(m[0].startsWith('</')?-1:1),0);}
export function foldMethods(html:string,path:string) {
 const headings=[...html.matchAll(/<h2\b[^>]*>[\s\S]*?<\/h2>/g)];
 const selected:Array<{start:number;end:number;headingStart:number;headingEnd:number;cue:string}>=[];
 for(let i=0;i<headings.length;i++){
  const h=headings[i],headingStart=h.index!,start=boundary(html,headingStart);
  const end=i+1<headings.length?boundary(html,headings[i+1].index!):html.length;
  const prior=html.slice(Math.max(0,start-300),headingStart);
  const method=methods.methods.find(m=>alternatives.has(m.id)&&path==='notes/methods/'+m.topic+'.md'&&prior.includes('id="'+m.id+'"'));
  const title=h[0].replace(/<[^>]*>/g,'').replace(/^\d+(?:\.\d+)*\s+/,'');
  const match=pages[path]?.test(title);
  if(!method&&!match)continue;
  // Do not split a source-authored disclosure or other containing structure.
  if(depth(html,start)!==0||depth(html,end)!==0)continue;
  selected.push({start,end,headingStart,headingEnd:headingStart+h[0].length,
   cue:method?'Choose when: '+method.clue+' · Result: '+method.result:choiceCue(title)});
 }
 for(const part of selected.reverse()){
  const heading=html.slice(part.headingStart,part.headingEnd),anchors=html.slice(part.start,part.headingStart);
  const body=html.slice(part.headingEnd,part.end);
  html=html.slice(0,part.start)+'<details data-method-fold><summary>'+heading+'<span class="method-choice-cue">'+escape(part.cue)+'</span></summary>'+anchors+body+'</details>'+html.slice(part.end);
 }
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
 if(/Windows/.test(title))return 'Windows built-in forwarding; check listener, routing and administrative prerequisites.';
 if(/sshuttle/.test(title))return 'Transparent TCP forwarding through an authorized SSH endpoint with its runtime prerequisites.';
 return 'Fixed TCP relay: select the reachable listener and destination explicitly.';
}
