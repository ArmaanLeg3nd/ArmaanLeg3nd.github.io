import type { MethodSummary, Topic } from './oscp-types';

const topicLabels: Record<string,string> = {
  discovery:'Discovery', services:'Services', 'web-mapping':'Web mapping', 'web-exploitation':'Web exploitation',
  credentials:'Credentials', 'public-exploits':'Public exploits', 'sessions-transfers':'Sessions & transfers',
  'linux-privesc':'Linux escalation', 'windows-privesc':'Windows escalation', 'ad-mapping':'AD enumeration',
  'ad-identities':'AD identity attacks', 'lateral-movement':'Lateral movement', pivoting:'Pivoting & tunnels',
  execution:'Execution troubleshooting', integration:'Integration & evidence'
};
const serviceLabels: Record<string,string> = {
  'service-ftp':'FTP', 'service-smb':'SMB / RPC', 'service-nfs':'NFS / RPC', 'service-ssh':'SSH',
  'service-dns':'DNS', 'service-snmp':'SNMP', 'service-smtp':'SMTP & mailbox protocols', 'service-ldap':'LDAP',
  'service-mysql':'MySQL / MariaDB', 'service-mssql':'SQL Server', 'service-postgres':'PostgreSQL',
  'service-redis':'Redis', 'service-oracle':'Oracle', 'service-remote':'RDP / WinRM / VNC / Telnet', 'service-sip-irc':'SIP / IRC'
};
export const topicLabel = (topic: Pick<Topic,'id'|'title'>) => topicLabels[topic.id] || topic.title;
export const methodLabel = (method: Pick<MethodSummary,'id'|'title'>) => serviceLabels[method.id] || method.title;

export const investigationSteps: Record<string,string[]> = {
  discovery:['Can I reach it?','Find open ports','Identify what is listening','Record targets worth investigating'],
  services:['Try the service with the access you have','Look for names, files and configuration','Check database permissions','Follow recovered credentials'],
  'web-mapping':['Confirm the site and login state','Browse features and inspect requests','Find hidden paths and hostnames','Choose an input or permission to test'],
  'web-exploitation':['Check file reads and uploads','Test command or SQL influence','Compare access between users and roles','Verify the finding before seeking execution'],
  credentials:['Identify the material and account','Can it be used directly?','Recover or use the matching credential type','Verify access, then enumerate again'],
  'public-exploits':['Does the exploit match this system?','Check the script and dependencies','Check architecture and compilation','Match the actual web request'],
  'sessions-transfers':['Verify your host and identity','Choose a reachable session route','Match the payload and terminal','Transfer a file and verify it'],
  'linux-privesc':['Inspect your identity and sudo rules','Look for useful secrets','Check privileged programs and writable paths','Find privileged jobs and what they consume','Check containers, mounts and software'],
  'windows-privesc':['Inspect your token and host','Check service, task and file permissions','Identify the exact execution opportunity','Look for credentials and useful token rights','Check software and drivers'],
  'ad-mapping':['Confirm domain identity and connectivity','Find users, groups and shares','Inspect service accounts and object rights','Verify a path to another host or identity'],
  'ad-identities':['Inspect existing tickets and access','Identify available credential sources','Check account flags and service accounts','Match object permissions to an action','Check certificate, delegation and policy paths'],
  'lateral-movement':['Can your source reach the destination?','Choose the matching credential type','Check remote execution rights','Verify WinRM or RDP access'],
  pivoting:['Map what the pivot can reach','Choose where the connection starts','Choose a forward, proxy or route','Check names and return connections','Verify each additional hop'],
  execution:['Identify what will consume the payload','Find the first failing execution step','Check PowerShell and endpoint restrictions','Verify the handler and connection direction'],
  integration:['Write down the current state','Connect findings to valid next actions','Return to the last working state if stuck','Save evidence and verify the report']
};

export const startingGroups = [
  {title:'An address or exposed service', items:[['An address or uncertain reachability','discovery'],['A reachable service','services']]},
  {title:'An application or potential exploit', items:[['A web application','web-mapping'],['Suspicious application behavior','web-exploitation'],['A plausible public exploit','public-exploits']]},
  {title:'Credentials or limited access', items:[['A password, key, hash or ticket','credentials'],['Command execution or a limited session','sessions-transfers']]},
  {title:'A host foothold', items:[['A Linux foothold','linux-privesc'],['A Windows foothold','windows-privesc']]},
  {title:'A domain or internal network', items:[['A domain identity','ad-mapping'],['A useful domain right or credential source','ad-identities'],['Credentials and another host','lateral-movement'],['An internal service or a broken return path','pivoting']]},
  {title:'A blocked path or evidence to organize', items:[['A payload that does not behave as expected','execution'],['Competing paths or reporting work','integration']]}
];
