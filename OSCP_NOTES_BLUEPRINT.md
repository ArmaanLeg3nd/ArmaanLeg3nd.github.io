# OSCP working reference: structure and editing blueprint

This is the maintenance contract for the concise reference at [OSCP notes](https://armaanleg3nd.github.io/oscp/nstsec/). Read it before changing the notes, navigation, tool aggregation or presentation. Keep it out of the learner-facing track index.

The owner's priority is a clean, direct-use reference: find the current task, read the necessary command and interpretation, then follow one relevant next step. Add useful coverage inside its existing home before adding navigation or another page. Do not turn additions into a second reference to navigate.

## 1. Reviewed baseline

Reviewed against the live site and local source on 2026-11-10, deployed revision `3f96c82ac75485079ed6eb16fe821bba0f992c0f`. All 44 document routes below returned successfully and matched the local built HTML byte for byte: one generated overview, 42 authored topic/index pages and one generated tools index. The snapshot also contains 20 assets and 37 extra-tool entries. These are a dated baseline, not permanent quotas or completeness claims.

The default `/oscp/` entry leads to `/oscp/nstsec/`. The older, larger collection is secondary at `/oscp/library/`; its detailed URLs still work. Do not copy the extended library wholesale into these concise notes. Its numbering, paired-command renderer and reviewed disclosure system are separate implementations, not features automatically present in this collection.

## 2. Navigation and page hierarchy

There are eight tracks in the existing order. A track can have a useful landing procedure plus focused service/technique pages; this is not literally one file per track. Keep a complete procedure together. The overview lists tracks, not every subsection or tool. Extra tools to obtain and Public exploit finder are utility links outside the eight tracks.

The tree below maps reviewed source paths to the published structure. Source root: `Sources/External/NSTSec-OSCP-notes/` in the OSCP vault. Remove `.md` and replace a terminal `README` with the containing directory to get the route beneath `/oscp/nstsec/`.

```text
/oscp/nstsec/                          generated overview
├── network-scan.md                    Network Scan
├── services-exploitation/README.md    Services Exploitation
│   ├── 21-ftp.md
│   ├── 25-465-587-smtp.md
│   ├── 53-dns.md
│   ├── 88-kerberos.md
│   ├── 80-443-http-s.md
│   ├── 110-995-pop.md
│   ├── 111-nfs-rpc.md
│   ├── 135-593-msrpc.md
│   ├── 139-445-smb.md
│   ├── 143-993-imap.md
│   ├── 161-snmp.md
│   ├── 389-636-3268-3269-ldap.md
│   ├── 3306-mysql.md
│   ├── 5432-postgres.md
│   └── 27017-mongodb.md
├── web-application-attacks/README.md   Web Application Attacks
│   ├── sql-injection.md
│   ├── file-inclusion-vulnerabilty.md
│   ├── command-injection.md
│   └── client-side-attacks.md
├── brute-forcing.md                   Brute Forcing
├── privilege-escalation/README.md     Privilege Escalation
│   ├── manual-enumeration/README.md
│   │   ├── windows-enumeration.md
│   │   └── linux-enumeration.md
│   ├── windows-privesc.md
│   └── linux-privesc.md
├── active-directory/README.md         Active Directory
│   ├── ad-manual-enumeration.md
│   ├── ad-automatic-enumeration.md
│   ├── ad-authentication.md
│   ├── ad-lateral-movement.md
│   ├── ad-attacking-kerberos.md
│   └── hash-cracking-techniques.md
├── transfer-files/README.md           Transfer Files
│   ├── windows-downloads.md
│   └── windows-uploads.md
├── shells/README.md                   Shells
│   ├── reverse-bind-shells.md
│   └── web-shells.md
├── tools/                            generated Extra tools to obtain
└── public-exploit-finder/             authored introduction + derived source links
```

The manual-enumeration subdirectory is physically nested but its three entries currently appear as peers beneath Privilege Escalation in the browser. The snapshot records child depth as a single level. Preserve the exact existing spelling of published paths, including `file-inclusion-vulnerabilty`, unless an intentional migration preserves old URLs.

### Presentation contract

- Fixed header: brand, centered notes search, secondary Extended library link.
- Desktop left: Overview, Extra tools to obtain, Public exploit finder, eight tracks. Only the current track's child branch starts expanded; branches use native disclosures.
- Center: breadcrumb, page title and the actual procedure. Avoid dashboards, repeated chooser panels and maintenance commentary in this area.
- Right on wide screens: the current page's H2/H3 contents, with H3 indentation. It disappears at widths of 1150px or less.
- At 760px or less: Browse tracks starts collapsed above the document; search stays in the fixed header on its own row. Extremely narrow overview uses one column.
- White/light presentation, consistent heading colors, restrained borders and spacing, blue underlined content links, copyable code blocks with build-time GitHub Light syntax colors, brief blockquote cues. Preserve command text; leave unlabelled output plain and use language aliases only for known fenced languages. Preserve authored parent red/blue/yellow emphasis using readable dark text on pale matching fills, including marked words in headings. Unmarked headings stay neutral; contents links stay muted. Do not add indiscriminate highlights or infer severity from a source color alone.
- Search uses local, decoded section text with literal phrase matching and page-title matches first. Present results as a centered floating overlay below the fixed header with a soft backdrop; do not shift the article. Open on search focus, dismiss on Escape/outside click, support Ctrl/Cmd+K, and retain the query when dismissed. Show at most eight page groups, a total match count and up to two compact occurrence excerpts per page, with filled matching-text highlights and section/alternative links. Optional disclosures receive deterministic per-page search targets and open when linked. Keep text/code intact, render query text safely, and retain keyboard navigation and a concise screen-reader status. Search is not semantic or context-ranked.
- Article disclosures are authored selectively. They are not automatically applied to every child heading, nor does this renderer currently add section-level expand-all controls or automatic command/interpretation columns.

## 3. Content ownership

### Public exploit finder utility (November 2026 addition)

The owner explicitly requested `/oscp/nstsec/public-exploit-finder/` as a cross-track link directory. It sits beside Extra tools to obtain, outside the eight track groups, and appears in ordinary notes search. This is a deliberate exception to avoiding new navigation layers: exploit discovery spans service, Linux, Windows and AD pages, while a compact directory lets the reader find a public source without duplicating those procedures.

- **Authored source:** vault `public-exploit-finder.md`, excluded from `SUMMARY.md` track membership. It owns a short search-resource table, affected-version/advisory links and the selection/review handoff. No exploit execution commands, setup instructions, copied PoC code or new default scans belong here.
- **Generated host-suggester list:** WES-NG, Linux Exploit Suggester 2 and the conditional legacy Watson alternative, with one selection cue and exact owning-page backlinks. Setup and commands remain in Windows/Linux Privesc. A suggester produces candidate CVEs, not confirmed exploitability.
- **Generated existing-reference list:** selected public exploit repositories and adjacent conditional technique references already linked on owning track pages. `src/lib/nstsec-exploit-links.mjs` classifies source URL families and concise cues; it does not own procedures. `sync-nstsec.mjs` includes only actual owning-page hyperlinks, preserves exact source URLs, groups duplicate URL/section pairs, and links the nearest owning heading. Exclude the finder and Extra tools pages from collection to prevent self-amplifying indexes.
- **Selection boundary:** include meaningful public exploit sources, version/patch suggesters and relevant permission-based reference collections, clearly labelled. Exclude general enumeration tools, credential tools, payload/web-shell generators, broad tutorial indexes and unreviewed bulk CVE feeds. General search websites need not be installed and do not become Extra tools entries.
- **Maintenance:** add or correct a source link at the procedure first, classify a genuinely new family if useful, then regenerate. Remove directory entries automatically when no owning link remains. Keep historical or conditional sources labelled; do not present a precompiled artifact as a verified match. Utility-page links must not count as owning instructions in Extra tools.
- **Validation:** preserve eight visible track groups; verify every generated source/backlink/fragment, absence of copied command blocks, deduplication, exclusion of unrelated URL prefixes and search discoverability. Check current official policy before claiming permission; using a Metasploit module remains subject to its restrictions even when the database listing is public.

The existing `tools.md` directory still owns only extra dependency links; this utility owns public-exploit discovery links. Neither becomes a separate source of operational instructions.

| Existing home | What belongs there |
| --- | --- |
| Network Scan | Manual scan baseline, AutoRecon follow-up, scope/coverage, saved output and distinct selected-port alternatives; one inline AutoRecon profile/setup and useful run controls. |
| Individual service pages | Service recognition, anonymous/authenticated enumeration, service-specific tool choices, focused validation and useful failure decisions. HTTP path discovery belongs on HTTP; ticket-based SMB inventory belongs on SMB. |
| Web Application Attacks | Application mapping on the landing; complete attack procedures in the existing injection/inclusion/client-side pages. Link HTTP discovery rather than repeating it. |
| Brute Forcing | Default credentials, wordlists/profiling/mangling and service-specific guessing variants with relevant constraints. |
| Manual Windows/Linux Enumeration | Built-in host/context/configuration checks. Keep these available for focused verification when automated enumeration is unavailable or inconclusive. |
| Windows/Linux Privesc | Short first pass, selected automated assessment, interpretation and finding-specific verification/exploitation. Keep distinct focused collectors beside the finding they support. |
| AD landing / Manual Enumeration | Starting identity/domain context and next-page choice / focused directory and relationship discovery. |
| AD Automatic Enumeration | Graph collection, readable LDAP inventory, native fallback, prerequisites and collection boundaries. No parallel automation-choice page. |
| AD Authentication | Credential and ticket acquisition/context. |
| AD Lateral Movement | Using an established identity/capability for host access and movement. |
| AD Attacking Kerberos | Ticket-related attack procedures. Where old content overlaps movement/authentication pages, choose one owner and link it when editing that procedure. |
| Hash Cracking Techniques | Offline recovery and useful hash-format/tool selection. |
| Transfer Files | Shared download/transfer baseline and transport choices; Windows directional variants stay on existing download/upload pages. |
| Shells | Direction and landed identity on the landing; connection/payload variants and web-shell procedures on their existing pages. |
| Extra tools to obtain | Aggregated actual extra-tool hyperlinks from the owning pages and backlinks to those notes. No independent setup, commands, ranking or recommendations. |
| Public exploit finder | Public search/advisory destinations and derived selected exploit/suggester hyperlinks with owning-section backlinks. No duplicated setup or execution procedures. |

These are ownership boundaries, not a claim that every inherited section already satisfies them. If a change crosses tracks, put the full procedure in one home and link to its exact relevant section from the other.

## 4. How to add or change content without clutter

Use this compact pattern for a new or substantially revised task section; do not mechanically wrap every old entry in another template:

1. **Task/result:** a heading that says what the reader is trying to establish or achieve.
2. **When/prerequisite:** only access, identity, connectivity or configuration that affects the choice.
3. **Baseline:** a complete copyable command or short ordered sequence.
4. **Read the result:** the decisive clue and what it does or does not establish.
5. **Next:** one conditional receiving section per useful outcome; name the missing check when the evidence is inconclusive.
6. **Distinct alternatives:** adjacent labelled disclosures, only when they change mechanism, access context, transport, trigger or a meaningful constraint.

Keep mandatory sequential checks, prerequisites and decisive interpretation visible. Collapse interchangeable methods or optional depth, not the whole decision path. Give summaries descriptive task names so the alternatives remain discoverable. Keep long commands in code blocks; use tables for compact comparisons, not as the default command container. Put reusable definitions inline once in their owning procedure and link subsequent uses.

### Placement decisions

| Proposed addition | Required treatment |
| --- | --- |
| Another tool for an existing task | Compare its actual coverage; replace only overlapping routine work, retain useful unique modes, and explain selection beside the owning procedure. |
| A useful missing check | Insert it at the point where its result changes the next action. Avoid appending an unrelated catch-all section. |
| Setup or download link | Keep it beside the tool's use. An actual source hyperlink makes it eligible for the generated extras aggregation if it is classified as an extra dependency. |
| Material already explained elsewhere | Link the canonical section; retain only a short local cue necessary to make the current step usable. |
| Long background, exhaustive variants or teaching examples | Keep them in the extended resources and link only where they help the current decision. |
| New page, navigation layer or track | First show why an existing owner cannot hold the coherent procedure without harming lookup. Do not create a page just to announce or compare additions. |
| Retirement or rename | Consolidate useful unique content first, fix receiving links, and preserve a redirect or anchor where practical. |

### Replacing wrappers with direct tool use

When replacing a custom wrapper in the concise notes, design the direct workflow around the learner's task. Do not mechanically paste the wrapper's generated command or reduce the tool to its shortest possible invocation. Assess which collection/plugin choices, authentication context, scope, output, concurrency, timing and other options provide a concrete benefit in that scenario. Keep useful upstream orchestration tools such as AutoRecon intact; there is no requirement to decompose them into their smallest constituent tools.

- Put a complete direct invocation or short necessary sequence in the existing owning section. Code blocks contain operational commands, without wrapper banners, print statements, explanatory comments or redundant bookkeeping. Keep necessary output capture and useful native tool output.
- Keep options that materially improve coverage, control, reliability or interpretation. Use suitable upstream defaults where no override is needed. Retain distinct non-overlapping capabilities and required authentication/configuration; explain a meaningful limitation briefly beside the command.
- Put stable, worthwhile plugin/configuration choices in one small inspectable configuration file when that makes use clearer. Define its contents and setup once, inline in a labelled disclosure on the owning page. A few clear flags can be preferable to another file; do not create configuration layers solely to conceal a long command. Avoid repeated file-path arguments when one deliberate profile selection is sufficient.
- Keep the baseline focused. Put complete variants for different access contexts, selected coverage, multiple assigned hosts, constrained connectivity or genuinely useful controls beside it. Do not make every optional setting part of every invocation or impose repeated When/Baseline/Interpretation/Next headings.
- Retain custom native collectors or correlations when they provide useful functionality rather than merely launching another tool. For individual questions, prefer an appropriate direct upstream or built-in check. Do not expand one useful collector into pages of duplicated low-level commands.
- Source-check options and relevant versions, inspect plugin behaviour and current exam restrictions, then verify the direct invocation in an authorized context before calling it live-validated. Testing a wrapper does not automatically validate a revised direct profile. Note material changes in coverage, defaults or removed safeguards in private review evidence; retain operational cues where they affect safe/correct use.
- Replace superseded wrapper instructions in place and consolidate duplication. Preserve the eight tracks, existing page ownership and useful links. Extra tools to obtain remains an aggregation of actual upstream links from those pages. Wrapper source files are not deleted merely because the notes switch to direct commands; deletion requires an explicit scope decision.

Keep the live playbook free of progress records, audit counts, build status, study metadata and real-target material. Do not label a tool exam-permitted without current official policy verification, or confuse source-checked commands with executed/lab-validated evidence.

## 5. Authoring and build ownership

| Resource | Authority and editing rule |
| --- | --- |
| Vault `Sources/External/NSTSec-OSCP-notes/*.md` and subdirectories | Reviewed authoring source for concise procedures; edit here first. |
| Source `SUMMARY.md` | Track order and topic membership. The introduction README is excluded from the generated topic pages. |
| Source `WORKING-INDEX.md` | Local entry point; not a separately rendered website page. |
| `scripts/sync-nstsec.mjs` | Converts source Markdown/GitBook markup, rewrites local destinations, copies assets and generates the tools index. |
| Vault `public-exploit-finder.md` / `src/lib/nstsec-exploit-links.mjs` | Utility introduction / selected URL-family classification and generated section backlinks. The utility stays out of SUMMARY track membership. |
| `src/content/oscp-nstsec.snapshot.json` | Generated build input, including rendered pages, headings, assets and derived tools. Never hand-author procedure changes here. Builds need neither the vault nor network access. |
| `src/content/oscp-tool-catalog.json` | Recognizes tool projects and aliases. Does not own usage guidance. |
| `src/content/oscp-extra-tools.json` | Extra-install eligibility names only. Does not own setup instructions. Stock/built-in tools stay excluded; custom/minimal Kali images may differ. |
| `src/pages/oscp/nstsec/[...slug].astro` | Overview and topic rendering, left/right navigation and current search behavior. |
| `src/styles/oscp-notes.css` | Standalone shared light styling. Keep it independent of the portfolio theme. |
| `src/pages/oscp/nstsec/automation.astro` | Compatibility redirect to overview. Not a content page. |
| This blueprint / `CONTENT_GUIDE.md` | Structural editing contract / site-wide build, deployment and other collection documentation. Neither is a learner-facing track. |

The tool directory currently groups qualifying links under five tracks; tracks without classified extra-tool hyperlinks have no empty tools section. Names occurring only in code/prose do not create an index entry. Each listed upstream URL must also exist on an owning page. The directory is an aggregation of classified extra dependencies, not every hyperlink or every installed command.

## 6. Required workflow for future changes

1. Read this blueprint and the owning source page; inspect adjacent sections and any existing canonical procedure before editing.
2. Identify the reader's task, existing owner, overlap and unique addition. Prefer a small in-place revision or consolidation. For broader consolidation, compare the parent/source capabilities: preserve useful focused modes and verify labelled links reach the precise owning section. A command existing somewhere else does not make it discoverable; retain parent anchors where the corresponding task remains. Keep the comparison/evidence private.
3. Source-check changed commands/policy as applicable. Keep private research and execution evidence outside the published content.
4. Edit the reviewed Markdown. Update `SUMMARY.md` only for intentional membership/order changes. Add tool source links at the usage location; update classification only if needed.
5. Run `node scripts/sync-nstsec.mjs <reviewed-source-checkout>`, `npm run build`, `node --test tests/nstsec.test.mjs` and `npm run check` as applicable to the changes. Inspect changed destinations/fragments and disclosures; use browser checks for layout/interaction changes.
6. Review the diff for duplicated procedures, disconnected links, needless navigation and private material. If structure changes intentionally, update this blueprint in the same change; never silently let it describe a different site.
7. Commit/push the reviewed website source and publish through the existing controlled Pages workflow when rendered content changes. Require successful deployment verification and check the live revision/content before reporting it published. Documentation-only blueprint changes need no rebuild or static deployment.

## 7. Known structural tensions to revisit when touching those sections

- Windows Privesc is much larger than its peers (110 code blocks in this baseline). New material should consolidate around the finding; do not add another parallel tool catalogue or split it automatically without considering the direct-use workflow.
- AD ticket/authentication/movement procedures and some transfer/shell entries have inherited overlap. Establish an owner and cross-link when reviewing the specific method; do not assume all duplication has already been removed.
- Some headings still name a tool or generic category rather than a task/result. Improve the local heading when revising its content, while checking fragment links.
- Some landing pages are sparse indexes and some service pages are short. Page count does not prove useful coverage; do not fill them with generic prose just for symmetry.
- Service ordering currently follows `SUMMARY.md` (including Kerberos before HTTP); the sidebar does not sort ports automatically. Any reorder must be explicit.
- Existing disclosures, interpretation cues and policy notes are uneven. This blueprint records structure and editing rules; it is not a content-completeness, exam-compliance or command-execution audit.
