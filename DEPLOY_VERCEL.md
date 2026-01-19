# Deploying Agility-device to Vercel

This repository contains a static site in the `edp/` folder.

## What I added

- `vercel.json` configured to serve the `edp/` folder as a static site.

## Quick deploy (CLI)

1. Install Vercel CLI (if needed):

```bash
npm install -g vercel
```

2. From your project root (`Agility-device`) login and deploy:

```bash
cd c:\Users\salav\OneDrive\Desktop\edp\Agility-device
vercel login
vercel --prod
```

During `vercel` prompts, set the project root to the repository root. The `vercel.json` routes ensure requests map to files under `edp/`.

## Deploy via GitHub (recommended)

1. Push the repository to GitHub.
2. In the Vercel dashboard, "New Project" → import repository.
3. In project settings, set Root Directory to `/` (default) — `vercel.json` will route to `edp/`.

## Notes

- If you'd prefer the site to be served from the repository root (no `edp/` prefix), move the files from `edp/` into the repo root or update `vercel.json` accordingly.
- To preview without `--prod`, run `vercel` (no flag) for preview deployments.
