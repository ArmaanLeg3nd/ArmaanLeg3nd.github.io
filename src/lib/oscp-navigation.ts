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

export const startingGroups = [
  {title:'An address or exposed service', items:[['An address or uncertain reachability','discovery'],['A reachable service','services']]},
  {title:'An application or potential exploit', items:[['A web application','web-mapping'],['Suspicious application behavior','web-exploitation'],['A plausible public exploit','public-exploits']]},
  {title:'Credentials or limited access', items:[['A password, key, hash or ticket','credentials'],['Command execution or a limited session','sessions-transfers']]},
  {title:'A host foothold', items:[['A Linux foothold','linux-privesc'],['A Windows foothold','windows-privesc']]},
  {title:'A domain or internal network', items:[['A domain identity','ad-mapping'],['A useful domain right or credential source','ad-identities'],['Credentials and another host','lateral-movement'],['An internal service or a broken return path','pivoting']]},
  {title:'A blocked path or evidence to organize', items:[['A payload that does not behave as expected','execution'],['Competing paths or reporting work','integration']]}
];
