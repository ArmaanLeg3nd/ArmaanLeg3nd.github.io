# Project index

The current public site is a minimal project index at `/` and `/projects/`.

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
