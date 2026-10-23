export const connectionFields = ['TARGET','LHOST','DC_IP','DOMAIN','USER','SUBNET','PORT','PORTS'] as const;
export type ConnectionField = typeof connectionFields[number];
export type CommandValues = Partial<Record<ConnectionField,string>>;
let sessionValues: CommandValues = {};
export const getSessionCommandValues = () => ({...sessionValues});
export function setSessionCommandValues(values: CommandValues) { sessionValues = {...values}; }
export function validValue(key: ConnectionField, value: string): boolean {
  if (!value) return true;
  if (value.length > 253) return false;
  if (key === 'PORT') return /^\d{1,5}$/.test(value) && +value > 0 && +value <= 65535;
  if (key === 'PORTS') return /^(?:\d{1,5}(?:-\d{1,5})?)(?:,\d{1,5}(?:-\d{1,5})?)*$/.test(value) && value.split(',').every(part => { const [a,b = a] = part.split('-').map(Number); return a > 0 && b >= a && b <= 65535; });
  if (key === 'USER') return /^[A-Za-z0-9_.@$-]+$/.test(value);
  if (key === 'SUBNET') return /^[A-Za-z0-9_.:/-]+$/.test(value);
  return /^[A-Za-z0-9_.:-]+$/.test(value);
}
export function substitute(template: string, values: CommandValues): string {
  return template.replace(/\b(TARGET|LHOST|DC_IP|DOMAIN|USER|SUBNET|PORTS|PORT)\b/g, (token: string) => {
    const key = token as ConnectionField;
    const value = values[key]; return value && validValue(key, value) ? value : token;
  });
}
