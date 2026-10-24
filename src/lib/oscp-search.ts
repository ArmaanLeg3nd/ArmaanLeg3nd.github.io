import { methodLabel } from './oscp-navigation.ts';
import type { MethodSummary, Method } from './oscp-types';

const aliases: Record<string,string> = {
  'nt-hash':'pass the hash pth', 'ticket-use':'pass the ticket ptt',
  'move-auth-material':'overpass the hash opth pass the key',
  'service-smb':'NT_STATUS_ACCESS_DENIED access denied NT_STATUS_LOGON_FAILURE login failure NT_STATUS_BAD_NETWORK_NAME',
  'domain-state':'KRB_AP_ERR_SKEW clock skew',
  'kerberos-roast':'KDC_ERR_S_PRINCIPAL_UNKNOWN service principal unknown',
  'web-traversal':'path traversal directory traversal lfi file read',
  'linux-suid':'setuid setgid', 'windows-token':'SeImpersonatePrivilege impersonation'
};
const normalize = (text:string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const words = (text:string) => normalize(text).split(/\s+/).filter(Boolean);
export function buildSearchText(method: Pick<Method,'id'|'title'|'family'|'clue'|'access'|'conditions'|'result'|'mechanics'|'checks'|'example'|'verify'|'failure'|'recognition'|'procedure'>): string {
  const fields=[methodLabel(method),aliases[method.id] || '',method.id,method.title,method.family,method.clue,method.access,method.conditions,method.result,method.mechanics,method.checks,method.example,method.verify,method.failure,method.procedure,...Object.values(method.recognition)];
  return [...new Set(words(fields.join(' ')))].join(' ');
}
export function searchMethods(methods: MethodSummary[],query:string): MethodSummary[] {
  const terms=[...new Set(words(query))];if(!terms.length)return [];
  const phrase=terms.join(' ');
  return methods.map((method,index) => {
    const tokens=new Set(words(method.search));
    if(!terms.every(term=>tokens.has(term) || (term.length>=3 && [...tokens].some(token=>token.startsWith(term)))))return {method,index,score:0};
    const label=normalize(methodLabel(method)),title=normalize(method.title),alias=normalize(aliases[method.id] || '');
    const score=1+(label===phrase?250:label.startsWith(phrase)?120:0)+(title===phrase?180:0)+((' '+alias+' ').includes(' '+phrase+' ')?160:0)
      +terms.reduce((sum,term)=>sum+(words(label).includes(term)?20:0)+(words(title).includes(term)?8:0)+(words(method.clue).includes(term)?3:0)+(tokens.has(term)?2:0),0);
    return {method,index,score};
  }).filter(item=>item.score>0).sort((a,b)=>b.score-a.score || a.index-b.index).map(item=>item.method);
}
