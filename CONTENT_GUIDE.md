# Project index

The public site contains the project index at `/` and `/projects/`, plus interactive workspaces under `/tools/`.

## Interactive tools

- `/tools/oscp/`: strategy overview, topic workflows and individually addressable methods.
- `/tools/attack-path/`: investigation JSON importer, graph, record inspector and connection editor.
- Both tools share the `oscp-investigation` version 1 JSON format. Saving investigation records is opt-in. Disabling saving retains the previous saved copy until explicitly cleared. Command-value inputs are in memory only and are never exported or stored.
- Navigation and tree preferences are saved separately; they do not record investigation outcomes.
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

The normal build requires neither a private workspace nor a network connection. It uses the snapshot hash/revision to identify content and prepares lazy topic JSON plus static readable method routes. The Markdown renderer is the same version already used by Astro, explicitly declared as a dependency.

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
