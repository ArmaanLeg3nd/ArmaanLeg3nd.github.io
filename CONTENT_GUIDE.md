# Project index

The public site contains the project index at `/` and `/projects/`, plus interactive workspaces under `/tools/`.

## Interactive tools

- `/tools/oscp/`: starting-capability groups, compact topic outlines and focused task reference pages. Existing direct method URLs are the canonical task locations.
- `/tools/attack-path/`: investigation JSON importer, graph, record inspector and connection editor.
- Both tools share the `oscp-investigation` version 1 JSON format. Saving investigation records is opt-in. Disabling saving retains the previous saved copy until explicitly cleared. Command-value inputs are in memory only and are never exported or stored.
- The last visited location is saved separately; browsing tasks does not record investigation outcomes.
- Local records are specific to the current origin/browser. Use Export JSON and Import JSON to move between browsers or devices. Keep secrets and real exam material out of notes.
- The in-memory investigation survives client-side navigation between the two tools, including with local saving off; a full reload clears unsaved records. Export before closing an unsaved investigation.

### Reference content

`src/content/oscp.snapshot.json` is a pinned public-safe snapshot, not a second authoring source. Edit the owning exploitation-reference procedures and reviewed definitions, regenerate the public `data/strategy-map.v1.json` using the OSCP documentation exporter, then run:

```powershell
node scripts/sync-oscp.mjs <path-to-public-strategy-map.v1.json>
npm run test:tools
npm run check
npm run build
```

The normal build requires neither a private workspace nor a network connection. It uses the snapshot hash/revision to identify content and prepares topic JSON plus static readable topic/task routes. Topic pages contain a compact family/task outline and the complete investigation flow. Each direct task page renders only that task, with commands first, recognition and conditional next actions below, and full usage notes and explanations available on the same page. The Markdown renderer is the same version already used by Astro, explicitly declared as a dependency.

`src/lib/oscp-navigation.ts` owns concise lookup names, short investigation steps and starting-capability groups. Names are presentation aliases; original titles remain in the task, and ranked global search includes aliases, original descriptions, commands, recognition samples, interpretation, verification and failure text. Exact lookup/error names rank first; token and prefix matching avoid unrelated substring hits. `MethodEntry` owns one focused reference page. `NextRoutes` retains every finding/action transition and its requirements. `src/lib/oscp-procedure.ts` groups adjacent code blocks sharing a language, with short comments labelling variants while preserving command bytes and order. Authored prerequisite, execution-location and policy cues remain beside the relevant blocks; a cue boundary prevents same-language blocks being merged. Short location headings are not repeated as extra paragraphs. Full source prose also remains in Full notes. Method requirements remain visible before the commands. Different execution contexts retain separate blocks; HTTP request bytes retain prose outside their blocks.

Temporary TARGET, LHOST, destination PORT and listener LPORT fields are directly available on desktop. LPORT has independent 1–65535 validation. Common unresolved template identifiers are highlighted without changing copied text; unrecognized tool-specific placeholders remain manual. Values and secrets remain excluded from investigation export. All values remain available in Workspace controls on mobile. Saving, recording and JSON import/export use the existing controls; the saving status and record count remain visible while closed. Task selection and cross-topic transitions use real URLs through Astro's ClientRouter. Historical topic/method anchors are redirected to the canonical task. Navigator styles remain scoped separately from the attack-path visualizer.

After building, `npm run test:tools` verifies every topic indexes each task once; each task route retains its complete original method fields, commands and transitions; all source command blocks remain in order; ranked troubleshooting search and separate port substitution work; each task has a gated receiving handoff and is reachable from discovery; and commands appear before the finding guide. Include browser checks for search aliases, task selection, history, command values/copy, usage-note links, recording and mobile overflow.

### Shared site behavior

Navigation availability comes from `site.json` and `src/lib/sections.ts`; the header and footer receive the same links. `src/content/tools.json` owns the tool directory and footer entries. Keep tool descriptions there rather than duplicating them across pages.

All page and workspace navigation uses Astro's ClientRouter. Command values and investigations survive client-side navigation in browser-module memory, and full reloads clear unsaved memory. Do not add a second history/popstate router inside a tool.

`MotionController` installs one reveal lifecycle per page, including panels mounted after hydration. Use `data-reveal` on meaningful sections, not on every keystroke-driven result or graph node. Reduced motion, keyboard focus and hidden documents keep content visible; leaving a page disconnects observers and stops animations. Tool CSS is scoped under `.tools-surface` to keep project/home styling stable across navigation.

JSON imports are limited to 1 MB, 200 steps and 500 connections. Invalid imports leave the current investigation intact. Replacing a nonempty investigation requires an in-page confirmation. Unknown historical method IDs retain their imported titles/evidence without inventing current prerequisites. Repeated methods use distinct step IDs; return connections are preserved.

## Content

Edit `src/content/projects.json` to add or update a project. Each entry has a name, category, summary, stack, and public GitHub repository URL. Optional `link` contains a label and URL for a package or store listing; optional `note` provides attribution.

Edit `src/content/site.json` for the site title, description, and GitHub profile link. Use verified public information only. Do not add a resume link.

The original unfinished sections and sample content are preserved locally in `.local-backup/scaffold/`, outside the build and Git. They are not published.

## Verify

```powershell
npm run check
npm run build
npm run preview -- --host 127.0.0.1 --port 4321
```

## Hosting

The site is hosted at https://armaanleg3nd.github.io/ from the `active-ghub-page` branch of `ArmaanLeg3nd/ArmaanLeg3nd.github.io`. Production contains only the built `dist/` files, including `.nojekyll`. Source is maintained on `codex/project-index`.

Publish by copying a verified build into a clean checkout of `active-ghub-page`, committing it, and pushing normally. Keep the existing branch history; no force push is needed. To roll back, revert the deployment commit on that branch.

`node scripts/prepare-pages.mjs` prepares `dist/` in the existing `.deploy/` checkout after it has been fetched/fast-forwarded to `origin/active-ghub-page`. It refuses a dirty or unexpected target, preserves Git metadata, and removes only obsolete tracked build files. Review the resulting diff, commit it, then push `HEAD:active-ghub-page` normally.

## Plain OSCP reference

`/oscp/` is a separate light-only reference with a white background, serif text, blue underlined links and a fixed hierarchical index. It does not import BaseLayout, the themed styles or ClientRouter. A small optional browser module adds literal subsection search and remembers chapter expansion/index scroll for the current tab session; the complete reference and indexes work without it. Search loads a static public index only when used, runs locally and stores no queries. Session storage holds only bounded navigation preferences. The left index contains numbered chapters and section pages only. The current page's numbered contents and variants stay in a separate fixed index on the right. On narrow screens both indexes occupy independently scrolling columns above the document.

`src/content/oscp-plain.snapshot.json` pins the tracked public README, notes, procedures and cheatsheets from the exploitation-reference repository. It includes the focused AD Notes library. Public Markdown links are rewritten to plain routes, including exact heading fragments; diagram assets are copied to `public/oscp/diagrams/`. Commands are never rewritten. Source-only files and unrelated external links retain their public URLs.

After updating public reference content:

```powershell
node scripts/sync-oscp-plain.mjs <public-reference-checkout>
npm run check
npm run build
npm run test:plain
npm run test:tools
```

The normal build uses the pinned snapshot and needs neither the private course workspace nor network access. The plain tests verify complete page coverage, untouched command text, heading targets, public-source link rewriting, diagram files and the absence of the themed shell. They also check literal subsection search, bounded navigation preferences, glossary code preservation and the matched AD interpretation cases. Verify the fixed index and heading jumps in desktop and narrow browser viewports when layout CSS changes. Publish through the existing GitHub Pages process above.

Numbering follows the eight study units; chapter 0 holds shared orientation, 9 holds operational procedures and 10 holds cheatsheets. The AD section catalogue is authored in the public reference's notes/ad-investigation/sections.json. src/lib/oscp-numbering.ts numbers the remaining rendered resources while retaining original IDs and command text. Authored variants and comment-labelled command variants become numbered child sections. Method handoffs use the existing reviewed when/requires transitions, with one exact numbered receiving section per condition. Old URLs and original anchors remain valid.
