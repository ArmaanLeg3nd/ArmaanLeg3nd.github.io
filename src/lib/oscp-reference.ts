import type {Topic} from './oscp-types';

export const topicLead:Record<string,string>={
  discovery:'Check your route, scan the assigned host with Nmap, then identify the applications on open ports. Keep UDP as a separate pass.',
  services:'Open the responding service below. Try its anonymous or known-account client, inspect readable data, then follow credentials or an exposed operation.',
  'web-mapping':'Capture a working request, check a missing path, then use Gobuster or ffuf. Replay interesting results with the correct hostname and session.',
  'web-exploitation':'Choose the input you actually control. Prove a file read, command effect, SQL result, upload handler or authorization change before choosing the next payload.',
  credentials:'Identify the password, hash, key or ticket first. Use the matching client or recovery tool, then verify which account and service it actually unlocks.',
  'public-exploits':'Search the confirmed product/CVE, read the PoC requirements, then fix its runtime and target parameters. Verify the effect before claiming access.',
  'sessions-transfers':'Confirm the target identity, choose a reachable shell direction, then stabilize the session and transfer the tools you need.',
  'linux-privesc':'Start with identity checks, LinPEAS and sudo -l. Follow a useful rule, privileged job, file capability or recovered credential into its matching procedure.',
  'windows-privesc':'Check the token and host, then use winPEAS or a focused helper. Inspect the exact service, task, file permission or credential that it reports.',
  'ad-mapping':'Verify domain identity, DC discovery, DNS and time. Collect directory/BloodHound data, then inspect useful groups, rights, shares and host access.',
  'ad-identities':'Choose the account right or credential material you actually have. Check its prerequisites, make the matching identity transition, then enumerate again.',
  'lateral-movement':'Test the destination and the accepted identity. Choose SMB, WMI, WinRM, RDP or a task only when that service and its required rights are available.',
  pivoting:'Check both network legs. Choose a fixed forward for one service, SOCKS for TCP clients, or a routed tunnel for an internal subnet; verify the return path.',
  execution:'Use the exact error to choose a check: file format, architecture, parser, PowerShell, handler or callback route. Repair the failed layer before changing the payload.',
  integration:'Record the working host, identity and route. Follow a supported next step, preserve proof at each change, and return to the last working boundary when stuck.'
};

export function referenceFamilies(topic:Topic) {
  // Put usable collectors before the technique catalogue, while retaining every member.
  return topic.families.map((family,index)=>({...family,index,title:family.title==='Candidate generation' ? 'Enumeration scripts' : family.title==='Software and candidate generation' ? 'Enumeration scripts & software checks' : family.title,methods:[...family.methods].sort((a,b)=>Number(['linux-enumerators','windows-enumerators'].includes(b))-Number(['linux-enumerators','windows-enumerators'].includes(a)))}))
    .sort((a,b)=>Number(b.methods.some(id=>['linux-enumerators','windows-enumerators'].includes(id)))-Number(a.methods.some(id=>['linux-enumerators','windows-enumerators'].includes(id))) || a.index-b.index);
}
