export const connectionFields = ['TARGET','LHOST','DC_IP','DOMAIN','USER','SUBNET','PORT','LPORT','PORTS'] as const;
export type ConnectionField = typeof connectionFields[number];
export type CommandValues = Partial<Record<ConnectionField,string>>;
let sessionValues: CommandValues = {};
export const getSessionCommandValues = () => ({...sessionValues});
export function setSessionCommandValues(values: CommandValues) { sessionValues = {...values}; }
export function validValue(key: ConnectionField, value: string): boolean {
  if (!value) return true;
  if (value.length > 253) return false;
  if (key === 'PORT' || key === 'LPORT') return /^\d{1,5}$/.test(value) && +value > 0 && +value <= 65535;
  if (key === 'PORTS') return /^(?:\d{1,5}(?:-\d{1,5})?)(?:,\d{1,5}(?:-\d{1,5})?)*$/.test(value) && value.split(',').every(part => { const [a,b = a] = part.split('-').map(Number); return a > 0 && b >= a && b <= 65535; });
  if (key === 'USER') return /^[A-Za-z0-9_.@$-]+$/.test(value);
  if (key === 'SUBNET') return /^[A-Za-z0-9_.:/-]+$/.test(value);
  return /^[A-Za-z0-9_.:-]+$/.test(value);
}
export function substitute(template: string, values: CommandValues): string {
  return template.replace(/\b(TARGET|LHOST|DC_IP|DOMAIN|USER|SUBNET|PORTS|LPORT|PORT)\b/g, (token: string) => {
    const key = token as ConnectionField;
    const value = values[key]; return value && validValue(key, value) ? value : token;
  });
}

// Reviewed template identifiers, not arbitrary uppercase commands or SQL keywords.
export const placeholderPattern = /\b(?:TARGET|LHOST|LPORT|PORTS|PORT|DC_IP|DOMAIN|USER|SUBNET|PASSWORD|HASH|NT_HASH|TICKET|PAYLOAD|PAYLOAD_EXE|FILE|WORDLIST|USERS|SHARE|SERVICE|DOMAIN_SID|TARGET_USER|TARGET_HOST|DC_HOST|PIVOT|PIVOT_IP|PIVOT_REACHABLE_IP|INTERNAL_HOST|INTERNAL_PORT|KALI_PORT|KALI_USER|KALI_SSH_PORT|SSH_PORT|TRANSFER_PORT|LOCAL_PORT|REMOTE_PORT|BASE64_DATA)\b/g;
export function unresolvedTokens(text: string): string[] { return [...new Set(text.match(placeholderPattern) || [])]; }
