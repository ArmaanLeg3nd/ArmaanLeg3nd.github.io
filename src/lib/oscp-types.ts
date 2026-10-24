export interface MethodSummary { id: string; topic: string; title: string; family: string; clue: string; access: string; conditions: string; search: string }
export interface Workflow { label: string; methods: string[] }
export interface Topic { id: string; title: string; blocks: string; access: string; intro: string; start: string; workflow: Workflow[]; families: { title: string; methods: string[] }[] }
export interface Stage { id: string; title: string; topics: string[] }
export interface PrerequisiteCheck { id:string; topic:string; conditions:string; html:string; inline:boolean; validationHtml:string; validationInline:boolean; sample:string; meaning:string; confirm:string; ruledout:string; unknown:string }
export interface FirstPassStep {title:string;method:string;note:string;commands:string;html:string;findings:{finding:string;check:string;target:string}[];fallback:{reason:string;target:string}}
export interface Method extends MethodSummary {
  result: string; mechanics: string; checks: string; procedure: string; example: string; verify: string; failure: string;
  recognition: { where: string; commands: string; sample: string; spot: string; confirm: string; enabled: string; ruledout: string; unknown: string };
  next: { id: string; when: string; requires: string }[];
  links: { guide: string; procedure: string; sheet: string };
  html: { checks: string; discovery: string; procedure: string; notes: string; baseline: string };
}
export interface ToolReference {name:string;method:string;topic:string;url:string;note:string}
export interface Catalog { toolbox:ToolReference[]; supplementarySource:{name:string;url:string;revision:string}; schemaVersion: number; contentHash: string; sourceRevision: string; stages: Stage[]; topics: Topic[]; methods: MethodSummary[]; chains: Record<string,string[]> }
export const methodURL = (m: Pick<MethodSummary,'topic'|'id'>) => `/tools/oscp/${m.topic}/${m.id}/`;
export const topicURL = (id: string) => `/tools/oscp/${id}/`;
