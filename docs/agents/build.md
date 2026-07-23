# Build Guide

## Purpose

- Documents `package.json`, `vite.config.js`, and the production deployment workflow.
- Optimized for future AI agents modifying build, dependency, or deployment behavior.
- Source config files:
  - `package.json`
  - `package-lock.json`
  - `vite.config.js`
  - `.github/workflows/deploy.yml`

## Package Metadata

- Package name: `daily-tasks-calendar`.
- Version: `1.0.0`.
- Private package: `true`.
- Module format: ES modules via `"type": "module"`.

Implications:

- Use `import` / `export` syntax.
- Vite config uses ESM imports.
- Do not convert to CommonJS unless intentionally changing the project module system.

## Scripts

### `npm run dev`

```json
"dev": "vite"
```

- Starts Vite development server.
- Serves `index.html`.
- Loads `/src/main.js` as the app entry.
- Provides Vite development transforms and hot reload behavior.

### `npm run build`

```json
"build": "vite build"
```

- Produces production assets in `dist/`.
- Applies Vite bundling and Tailwind CSS processing.
- Uses `base: '/daily-task/'` from `vite.config.js`.
- This is the command used by GitHub Actions production workflow.

### `npm run preview`

```json
"preview": "vite preview"
```

- Serves the built `dist/` output locally.
- Use after `npm run build` to verify production build behavior.
- This is not the same as the dev server.

## Dependencies

### Runtime/Build Dependencies

- `vite` `^7.0.6`
  - Development server.
  - Production bundler.
  - Preview server.

- `tailwindcss` `^4.1.11`
  - Utility CSS framework.
  - Imported from `src/styles.css` with `@import "tailwindcss";`.

- `@tailwindcss/vite` `^4.1.11`
  - Tailwind plugin for Vite.
  - Registered in `vite.config.js`.

### Dev Dependencies

- `devDependencies` is currently empty.
- Build tooling is listed under `dependencies`.

## Vite Configuration

`vite.config.js`:

```js
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/daily-task/',
  plugins: [tailwindcss()],
});
```

### `base`

- Current value: `/daily-task/`.
- Required for GitHub Pages deployment under a repository/project path.
- Affects asset URLs in production builds.
- Do not change unless the deployment path changes.

### `plugins`

- Current plugins:
  - `tailwindcss()`

- Tailwind is integrated through Vite, not a separate PostCSS config.
- Do not add CSS build config files unless needed by a real change.

## Build Process

```text
npm run build
  -> vite build
  -> read index.html
  -> follow module entry /src/main.js
  -> import src/styles.css
  -> process Tailwind CSS
  -> bundle JS/CSS/assets
  -> emit dist/
```

Important details:

- `dist/` is generated output.
- Source of truth remains `index.html`, `src/`, `package.json`, and `vite.config.js`.
- Do not edit generated `dist/` files manually.
- Rebuild `dist/` when production artifacts need to be refreshed.

## Dev Server

```text
npm run dev
  -> vite
  -> serve app locally
  -> load index.html
  -> execute src/main.js
```

Notes:

- Vite chooses the default dev host/port unless overridden by CLI flags.
- No custom dev server config exists.
- No proxy config exists.
- No environment variables are required for current development.

## Production Workflow

Production deployment is defined in `.github/workflows/deploy.yml`.

Trigger:

```text
push to master
```

Permissions:

- `contents: read`
- `pages: write`
- `id-token: write`

Concurrency:

- Group: `pages`.
- `cancel-in-progress: true`.

### Build Job

```text
ubuntu-latest
  -> actions/checkout@v4
  -> actions/setup-node@v4 with node-version 20 and npm cache
  -> npm ci
  -> npm run build
  -> upload ./dist as Pages artifact
```

### Deploy Job

```text
needs build
  -> environment github-pages
  -> actions/deploy-pages@v4
```

- Deploys the uploaded `dist/` artifact to GitHub Pages.
- The deployment URL is exposed by `${{ steps.deployment.outputs.page_url }}`.

## Production Assumptions

- Default production branch is `master`.
- GitHub Pages serves the app from `/daily-task/`.
- Node 20 is the CI runtime.
- `package-lock.json` is committed and `npm ci` is used in CI.
- The app is static and browser-only; no server runtime is deployed.

## Future Build Changes

### Adding A Dependency

- Use npm so `package.json` and `package-lock.json` stay in sync.
- Prefer small dependencies; the app is intentionally vanilla and lightweight.
- Do not add frameworks or heavy calendar/state libraries unless explicitly requested.

### Changing Deployment Path

1. Update `base` in `vite.config.js`.
2. Verify built asset URLs.
3. Verify GitHub Pages repository/path settings.
4. Update docs that mention `/daily-task/`.

### Adding Environment Variables

- Use Vite's `import.meta.env` conventions.
- Client-exposed variables must use the `VITE_` prefix.
- Document required variables here and in README if user-facing setup changes.
- Never commit secrets; this is a static browser app.

### Adding Tests Or Linting

- Add explicit scripts to `package.json`.
- Keep CI updated if the new checks are required for production.
- Prefer deterministic checks that run without browser credentials or external services.

### Changing CSS Pipeline

- Keep Tailwind through `@tailwindcss/vite` unless there is a clear need.
- Avoid introducing PostCSS config, Sass, CSS modules, or component CSS systems without a concrete requirement.

## Things To Avoid

- Do not edit `dist/` as source.
- Do not remove `base: '/daily-task/'` without confirming deployment path.
- Do not bypass `npm ci` in CI unless package management changes.
- Do not add server-only dependencies for browser-only features.
- Do not add a second bundler.
- Do not convert ESM config/source files to CommonJS casually.
