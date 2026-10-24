import type { MethodSummary, Topic } from './oscp-types';

export const stageURL = (id: string) => `/tools/oscp/stages/${id}/`;
export interface Gate { label: string; check: string }
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

export interface DecisionBranch { clue: string; action: string; methods: string[]; gates: Gate[] }
export interface TopicGuide { root: string; start: string; entry?: Gate[]; branches: DecisionBranch[] }
const branch = (clue: string, action: string, methods: string[], label: string, check: string): DecisionBranch => ({clue,action,methods,gates:[{label,check}]});

// Navigation summaries over the reviewed catalog. Full commands, receiving prerequisites
// and conditional transitions remain authoritative on each linked task page.
export const topicGuides: Record<string, TopicGuide> = {
  discovery: { root:'Establish the source path', start:'path-hosts', branches:[
    branch('Scope is known; coverage is incomplete','Build the endpoint queue',['tcp-coverage','udp-coverage','windows-discovery'],'Choose coverage explicitly','Separate TCP discovery from service detection and UDP; account for source privileges and discovery filtering.'),
    branch('A listener responds','Identify the actual application',['identify-app','unknown-port'],'Require application evidence','Use responses and protocol behavior rather than assuming the default port identifies the service.'),
    branch('Silence, conflict or a new route','Validate and revisit the queue',['result-validation'],'Separate failure from absence','Recheck route and source, filtering and scan limits before ruling out the endpoint.'),
  ]},
  services: { root:'Identify the endpoint & access context', start:'identify-app', branches:[
    branch('File or shell service','Test access with the matching client',['service-smb','service-ftp','service-nfs','service-ssh'],'Separate identity from object rights','Name anonymous/guest/local/domain context, then check the exact share, file, export or session permission.'),
    branch('Names, accounts or configuration','Expand the service evidence',['service-dns','service-snmp','service-smtp','service-ldap'],'Use a supported query context','Check protocol reachability and whether anonymous or authenticated queries are actually accepted.'),
    branch('Database or other protocol','Inspect identity and effective grants',['service-mysql','service-mssql','service-postgres','service-redis','service-oracle','service-remote','service-sip-irc'],'Inspect the specific permission','Authentication alone does not grant file access, execution or a remote session; test that distinct right.'),
  ]},
  'web-mapping': { root:'Establish the real request context', start:'web-identity', branches:[
    branch('A function, role or input is visible','Map normal behavior first',['web-behavior','web-parameters'],'Preserve request state','Record host, scheme, method, input location, session and expected response before varying one boundary.'),
    branch('Source, scripts, backup or config','Inspect exposed artifacts',['web-artifacts'],'Verify actual content','Read the returned object; a successful status or interesting filename does not prove a useful artifact.'),
    branch('Paths or hostnames are missing','Discover with response controls',['web-content','web-vhosts'],'Establish negative controls','Compare missing paths/hosts, redirects, response bodies and authentication before filtering candidates.'),
  ]},
  'web-exploitation': { root:'Choose a hypothesis from a mapped function', start:'web-parameters', branches:[
    branch('File paths, includes or uploads','Prove the file primitive',['web-traversal','web-php-source','web-upload','web-lfi-log','web-upload-exec','web-upload-path'],'Prove read, write or interpretation separately','Find the actual path, content control and compatible privileged/interpreting consumer before claiming execution.'),
    branch('Command or query influence','Validate the parser and result channel',['web-command','sql-influence','sql-auth','sql-union','sql-blind','sql-oob','sql-os'],'Use controlled comparisons','Keep the request context fixed; prove input influence and DBMS/OS conditions before attempting a stronger primitive.'),
    branch('Ownership, role or server-side behavior','Test the exact trust boundary',['web-idor','web-authz','web-mass-assignment','web-xss','web-cms','web-ssrf'],'Identify the actor and useful effect','Use the required identities, object/role controls and consumer; verify the resulting data access or action.'),
  ]},
  'public-exploits': { root:'Match component and configuration', start:'exploit-select', branches:[
    branch('PoC assumptions match the target','Review the runtime before use',['exploit-runtime'],'Inspect what the PoC does','Check required access, dependencies, interpreter and traffic; a version match alone is insufficient.'),
    branch('Native build or architecture mismatch','Inspect and adapt the build',['exploit-compile'],'Match process and runtime','Verify architecture, ABI, dependencies and target assumptions before interpreting a compile or execution failure.'),
    branch('Login, endpoint or request differs','Reconstruct the real web request',['exploit-web'],'Compare the actual exchange','Check session state, paths, tokens, parameters and parser behavior against the PoC assumptions.'),
  ]},
  'sessions-transfers': { root:'Verify where commands execute', start:'session-proof', branches:[
    branch('Execution works; access is fragile','Choose a viable session channel',['session-reverse','session-bind','session-windows','payload-generate','session-tty'],'Verify direction and consumer','Check interpreters, listener location, connection initiator, payload format and actual terminal needs.'),
    branch('A file must cross the boundary','Choose an available transfer route',['transfer-http','transfer-scp','transfer-smb','transfer-ftp','transfer-stream','transfer-text'],'Check both ends and verify bytes','Match clients, authentication, direction and binary/text handling; verify the received artifact.'),
    branch('Output or callback is missing','Locate the first failed boundary',['execution-format','execution-handler','execution-callback'],'Keep execution and transport separate','Recheck process identity and output channel, handler match and the real source-to-destination route.'),
  ]},
  credentials: { root:'Classify material and account scope', start:'credential-classify', branches:[
    branch('Password, private key or ticket','Validate compatible authentication',['credential-use','ssh-key','ticket-use'],'Match identity and mechanism','Check account scope, artifact format, expiry/protection and compatible protocol; acceptance still needs authorization.'),
    branch('A stored verifier or captured response','Use type-specific recovery or reuse',['offline-recovery','nt-hash','netntlm-recovery','dcc2-recovery','linux-hashes','keepass-recovery'],'Identify the artifact precisely','NT hashes, captured responses, cached verifiers and protected databases have different recovery and reuse rules.'),
    branch('A new identity is accepted','Re-enumerate its actual rights',['move-preflight','service-smb','domain-state'],'Prove the receiving service right','Check source-to-service connectivity and effective access rather than inferring privilege from a successful login.'),
  ]},
  'linux-privesc': { root:'Establish UID, groups and host state', start:'linux-state', branches:[
    branch('Delegated execution or special permissions','Resolve the exact execution rule',['linux-sudo','linux-preload','linux-suid','linux-capabilities','linux-policy'],'Verify effective execution context','Check the full rule, executable, environment restrictions and resulting UID/capability; labels alone are candidates.'),
    branch('Writable object, job or load path','Find the privileged consumer',['linux-permissions','linux-jobs','linux-path','linux-wildcard','linux-library'],'Require a consumer and trigger','Verify object and parent permissions, real process identity, path resolution and a reachable invocation.'),
    branch('Secrets, daemon, mount or software clue','Follow the matching configuration',['linux-secrets','linux-containers','linux-mounts','linux-kernel','linux-enumerators'],'Validate the exact candidate manually','Inspect exposure, service/mount configuration or build requirements; automated findings do not establish an escalation.'),
  ]},
  'windows-privesc': { root:'Establish token, groups and host state', start:'windows-state', branches:[
    branch('Writable service, task or dependency','Trace configuration to execution',['windows-acl','windows-service-config','windows-service-binary','windows-unquoted','windows-dll','windows-tasks'],'Require effective ACLs and a trigger','Check exact object/parent rights, service/task identity and restart/invocation conditions; path appearance is not proof.'),
    branch('Secret, token privilege or backup right','Validate the distinct access context',['windows-secrets','windows-token','windows-backup'],'Check usable material or privilege','Inspect protection, token privilege state and its required operation; verify the resulting identity or recovered material.'),
    branch('Installer, driver or build candidate','Validate configuration before selection',['windows-installer','windows-kernel','windows-enumerators'],'Verify all enabling settings','Check policy, build, architecture and required access; prefer evidence over scanner labels.'),
  ]},
  'ad-mapping': { root:'Establish identity, realm and DC path', start:'domain-state', branches:[
    branch('Directory queries are available','Map objects, groups and shares',['domain-directory','domain-shares','domain-spns'],'Keep identity and object context','Resolve naming contexts and nested groups; attach each SPN/share to the actual account or object.'),
    branch('An interesting permission is visible','Resolve effective object rights',['domain-acl'],'Check the specific ACE and object','Account for inheritance, object type, effective principal and any separate permission needed for the next operation.'),
    branch('A host, session or graph edge is useful','Validate the path edge by edge',['domain-hosts','domain-graph'],'Check destination rights and freshness','Prove host-specific authorization and reachable services; stale sessions and graph suggestions are not access evidence.'),
  ]},
  'ad-identities': { root:'Match the identity source or effective right', start:'kerberos-tickets', branches:[
    branch('Local credential source or ticket exists','Inspect protection and classify material',['ad-lsass','ad-sam','ad-security','ad-dpapi','ad-ntds','kerberos-tickets'],'Match privilege, protection and source','Check exact host rights, source availability and produced material; do not assume one credential source unlocks all others.'),
    branch('Account flag, SPN or key is known','Validate the Kerberos-specific path',['kerberos-asrep','kerberos-roast','ad-targeted-roast','kerberos-silver','kerberos-golden'],'Require the exact flag, SPN or key','Check account configuration and key scope/type; ticket construction paths need their particular keys and identifiers.'),
    branch('Object control or special configuration','Inspect the receiving operation',['ad-password-reset','ad-group-control','ad-owner-dacl','ad-dcsync','ad-gpo','ad-delegation','ad-certificates'],'Verify every operation prerequisite','Resolve effective ACEs, object type and replication/delegation/certificate/GPO conditions before selecting the transition.'),
  ]},
  'lateral-movement': { root:'Verify destination, identity and transport', start:'move-preflight', branches:[
    branch('An authentication artifact is available','Match the protocol and material',['move-auth-material'],'Separate authentication from authorization','Check password/hash/key/ticket compatibility and scope, then test the specific receiving service right.'),
    branch('Service, task or management rights','Match execution and output paths',['move-services','move-smbexec','move-tasks','move-wmi','move-dcom'],'Verify transport plus execution rights','Check SMB/RPC/DCOM reachability, effective object rights and the separate output channel.'),
    branch('WinRM or remote-interactive access','Verify endpoint and resulting token',['move-winrm','move-rdp'],'Check endpoint-specific permission','Prove WinRM/RDP authorization and connectivity; verify session identity and privilege after acceptance.'),
  ]},
  pivoting: { root:'Map the pivot and both connection legs', start:'pivot-state', branches:[
    branch('One endpoint or a callback is needed','Draw listener and initiator locations',['fixed-forward','ssh-local','ssh-remote','windows-forward','chisel-reverse','chisel-forward','pivot-callback'],'Check both legs independently','Name bind address, listener host, initiating host and destination; delivery and callback may require separate routes.'),
    branch('Several services or a subnet is needed','Choose proxy or routed access',['ssh-dynamic','ssh-remote-dynamic','proxy-clients','sshuttle-route','ligolo-route'],'Match real protocol requirements','Check client proxy support, TCP/UDP behavior, privileges, return path and name resolution before choosing a tunnel.'),
    branch('Names, identity traffic or extra hops fail','Validate each dependency and leg',['pivot-dns','pivot-multihop','pivot-dns-tunnel'],'Locate the first failing boundary','Test DNS/KDC paths and each intermediate route separately before chaining the final application.'),
  ]},
  execution: { root:'Identify the first failing boundary', start:'execution-format', branches:[
    branch('Bytes, parser or runtime is wrong','Match the execution environment',['execution-format','execution-parser','execution-powershell','execution-controls'],'Inspect the exact consumer','Check file format, architecture, encoding, quoting, language mode and recorded control evidence.'),
    branch('A user or application must consume it','Verify interaction and interpretation',['execution-office','execution-library'],'Require the real consumer and trigger','Confirm expected application behavior, execution identity and the necessary interaction; file placement alone is insufficient.'),
    branch('Execution may work; session does not','Inspect handler and packet direction',['execution-handler','execution-framework','execution-callback'],'Match payload, lifecycle and route','Verify the handler/session combination and actual connection initiator before changing payloads.'),
  ]},
  integration: { root:'Record the current proven state', start:'attack-state', branches:[
    branch('A new transition is proposed','Connect only supported prerequisites',['attack-chains'],'Use evidence for each receiving condition','Keep inferred, possible, confirmed and disproven states distinct; a diagram edge does not prove a working chain.'),
    branch('Tests stop producing new evidence','Return to the last working state',['attack-recovery'],'Preserve what changed','Record attempted conditions and failures, revisit enumeration and choose a hypothesis supported by new evidence.'),
    branch('Access or privilege changed','Capture and validate reproduction',['attack-evidence','attack-report'],'Retain identity and reproduction evidence','Record host, identity, commands and results; inspect rendered reporting/archive artifacts for completeness.'),
  ]},
};

export const smbGuide: TopicGuide = { root:'Enumerate SMB / RPC', start:'service-smb', entry:[
  {label:'Confirm the SMB endpoint',check:'Require SMB application evidence and source-to-service reachability.'},
  {label:'Name the current access context',check:'Distinguish anonymous, guest, local or domain identity; validate the rights on the exact share or file.'},
], branches:[
  branch('Readable file','Classify the material',['credential-classify'],'Read the exact object and record its provenance','Prove file read under the current SMB identity; identify source, account scope and artifact type before attempting reuse.'),
  branch('Accepted domain identity','Map domain context',['domain-state'],'Confirm the domain identity and directory path','Check account scope, DC, DNS, realm, clock and routes before selecting a directory operation.'),
  branch('Writable share','Validate the file consumer',['execution-format'],'Identify the consumer and trigger','Prove exact write permissions, then path, interpretation, consuming identity and usable trigger; write access is not execution.'),
]};

export function methodGates(method: MethodSummary): Gate[] {
  return [{label:'Required access',check:method.access},{label:'Enabling conditions',check:method.conditions}];
}
export function entryGates(topic: Topic): Gate[] {
  return [{label:'Starting situation',check:topic.start},{label:'Access context',check:topic.access}];
}
