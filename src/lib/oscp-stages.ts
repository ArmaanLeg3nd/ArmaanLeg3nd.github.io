
export const stageURL = (id: string) => `/tools/oscp/stages/${id}/`;
export interface StageGuide { title: string; summary: string; prerequisite: string; check: string }
export const stageGuides: Record<string, StageGuide> = {
  discovery: { title:'Discovery', summary:'Scope, reachability & listeners', prerequisite:'Explicit scope and a known source path.', check:'Confirm the assigned host/range, interface and route.' },
  enumeration: { title:'Enumeration', summary:'Services, files, identities & web', prerequisite:'A reachable listener and application evidence.', check:'Identify the protocol; record the endpoint and access context.' },
  'initial-access': { title:'Initial access', summary:'Validate an entry route', prerequisite:'An evidence-backed weakness and its specific prerequisites.', check:'Match the feature, permissions, input and trigger; credentials can provide a different entry.' },
  'usable-access': { title:'Usable access', summary:'Verify the session & identity', prerequisite:'An execution primitive or accepted authenticated access.', check:'Verify host, identity, privilege and the output/connection path.' },
  'local-privilege': { title:'Local privilege', summary:'Permissions → consumer → trigger', prerequisite:'A verified foothold with a known UID/token.', check:'Identify effective permissions and the privileged consumer or trigger.' },
  'active-directory': { title:'Active Directory', summary:'May start with domain credentials', prerequisite:'A domain identity or a supported directory-query context.', check:'Check realm, DC, DNS, clock and route; validate each object/host right.' },
  'internal-access': { title:'Internal access', summary:'Forward, proxy or route', prerequisite:'A controlled pivot and a useful reachable destination.', check:'Check both legs, protocol requirements, DNS and any separate callback route.' },
  evidence: { title:'Evidence & reporting', summary:'Throughout the path', prerequisite:'Recorded observations and reproducible transitions.', check:'Capture host, identity, commands and results; distinguish planned from confirmed.' },
};

