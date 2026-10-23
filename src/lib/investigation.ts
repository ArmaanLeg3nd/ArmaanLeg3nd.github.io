export const statuses = ['planned','attempted','confirmed','ruled-out','inconclusive'] as const;
export type StepStatus = typeof statuses[number];
export interface InvestigationStep { id: string; methodId: string; methodTitle: string; status: StepStatus; host: string; identity: string; capability: string; observation: string; createdAt: string }
export interface InvestigationEdge { id: string; from: string; to: string; label: string }
export interface Investigation { schemaVersion: 1; kind: 'oscp-investigation'; id: string; title: string; contentHash: string; createdAt: string; updatedAt: string; steps: InvestigationStep[]; edges: InvestigationEdge[] }
export const STATE_KEY = 'oscp-investigation-v1';
export const SAVE_KEY = 'oscp-saving-enabled-v1';
export const MAX_IMPORT_BYTES = 1024 * 1024;
let sessionInvestigation: Investigation | null = null;
// Browser-module memory survives client-side tool navigation, never a reload.
export const getSessionInvestigation = () => sessionInvestigation;
export function setSessionInvestigation(document: Investigation) { sessionInvestigation = validateInvestigation(document); }
export const uid = () => globalThis.crypto?.randomUUID?.() || `step-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function freshInvestigation(contentHash: string): Investigation {
  const now = new Date().toISOString();
  return { schemaVersion:1, kind:'oscp-investigation', id:uid(), title:'Untitled investigation', contentHash, createdAt:now, updatedAt:now, steps:[], edges:[] };
}
type ObjectValue = Record<string, unknown>;
function object(value: unknown): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a JSON object.');
  return value as ObjectValue;
}
function text(value: unknown, field: string, max = 4000): string {
  if (typeof value !== 'string' || value.length > max || /\u0000/.test(value)) throw new Error(`Invalid or oversized ${field}.`);
  return value;
}
function identifier(value: unknown, field: string): string {
  const result = text(value,field,160);
  if (!/^[A-Za-z0-9_-]+$/.test(result)) throw new Error(`Invalid ${field}.`);
  return result;
}
function date(value: unknown, field: string): string {
  const result = text(value,field,40);
  if (!Number.isFinite(Date.parse(result))) throw new Error(`Invalid ${field}.`);
  return result;
}
/** Allowlisted reconstruction excludes command values, secrets fields and arbitrary imported properties. */
export function validateInvestigation(input: unknown): Investigation {
  const d = object(input);
  if (d.schemaVersion !== 1 || d.kind !== 'oscp-investigation') throw new Error('Unsupported investigation format. Expected oscp-investigation version 1.');
  if (!Array.isArray(d.steps) || d.steps.length > 200 || !Array.isArray(d.edges) || d.edges.length > 500) throw new Error('Maximum 200 steps and 500 connections per investigation.');
  const steps = d.steps.map(value => {
    const s = object(value);
    if (!statuses.includes(s.status as StepStatus)) throw new Error('Unknown step outcome.');
    return { id:identifier(s.id,'step ID'), methodId:identifier(s.methodId,'method ID'), methodTitle:text(s.methodTitle,'method title',300), status:s.status as StepStatus,
      host:text(s.host,'host label',200), identity:text(s.identity,'identity label',200), capability:text(s.capability,'capability',500), observation:text(s.observation,'observation'), createdAt:date(s.createdAt,'step date') };
  });
  const ids = new Set(steps.map(s => s.id));
  if (ids.size !== steps.length) throw new Error('Duplicate step IDs.');
  const edges = d.edges.map(value => {
    const e = object(value);
    const from = identifier(e.from,'connection source'), to = identifier(e.to,'connection destination');
    if (!ids.has(from) || !ids.has(to)) throw new Error('A connection refers to a missing step.');
    return { id:identifier(e.id,'connection ID'), from, to, label:text(e.label,'connection label',300) };
  });
  if (new Set(edges.map(e => e.id)).size !== edges.length) throw new Error('Duplicate connection IDs.');
  return { schemaVersion:1, kind:'oscp-investigation', id:identifier(d.id,'investigation ID'), title:text(d.title,'title',200), contentHash:text(d.contentHash,'content hash',128),
    createdAt:date(d.createdAt,'creation date'), updatedAt:date(d.updatedAt,'update date'), steps, edges };
}
export function parseInvestigation(source: string): Investigation {
  if (new TextEncoder().encode(source).length > MAX_IMPORT_BYTES) throw new Error('JSON file exceeds 1 MB.');
  let value: unknown;
  try { value = JSON.parse(source); } catch { throw new Error('This file is not valid JSON.'); }
  return validateInvestigation(value);
}
export function serializeInvestigation(document: Investigation): string {
  return JSON.stringify(validateInvestigation(document),null,2) + '\n';
}
export function addStep(document: Investigation, step: InvestigationStep, predecessor = ''): Investigation {
  if (document.steps.length >= 200) throw new Error('Maximum 200 steps per investigation.');
  if (predecessor && !document.steps.some(s => s.id === predecessor)) throw new Error('Previous step no longer exists.');
  const next = { ...document, updatedAt:new Date().toISOString(), steps:[...document.steps,step], edges:predecessor ? [...document.edges,{id:uid(),from:predecessor,to:step.id,label:'Recorded transition'}] : document.edges };
  return validateInvestigation(next);
}
export function removeStep(document: Investigation, id: string): Investigation {
  return { ...document, updatedAt:new Date().toISOString(), steps:document.steps.filter(s => s.id !== id), edges:document.edges.filter(e => e.from !== id && e.to !== id) };
}
