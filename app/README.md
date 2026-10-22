# DeskShare app — developer notes

Profile `static`: plain HTML/CSS/JS ES modules in `public/` (published as is, no build step), bookings in the browser's `localStorage`. Spec: `../docs/04-spec/`. Build progress: `../docs/04-spec/build-status.md`.

## Run

```sh
cd app
npm install                     # once; dev dependencies only, local
npm run dev                     # http://127.0.0.1:4173/
```

Windows PowerShell: if script execution is blocked, use `npm.cmd` instead of `npm` (e.g. `npm.cmd run dev`).

Test hooks — only on `localhost` / `127.0.0.1`, ignored on the deployed site:

| URL | Effect |
|---|---|
| `http://127.0.0.1:4173/?now=2026-10-22T09:00` | clock set to that office time (UTC+5), keeps running |
| `http://127.0.0.1:4173/?reset-demo` | delete DeskShare data, load the demo seed (from US-002) |

## Test

```sh
npm test                        # unit (Vitest)
npx playwright install chromium # once, before the first E2E run
npm run test:e2e                # E2E (Playwright, Chromium desktop; starts the local server)
npm run test:e2e:all            # + Edge and phone emulation for US-015 (needs `npx playwright install webkit`)
```

Reset demo data on the deployed site: see the repository `README.md` (clear site data).

## Layout

| Path | Content |
|---|---|
| `public/index.html`, `public/styles.css` | page shell |
| `public/js/config.js` | every assumed value (only place) |
| `public/js/messages.js` | every user text |
| `public/js/clock.js`, `public/js/time.js` | office clock (UTC+5) |
| `public/js/storage.js` | the only storage module |
| `public/js/app.js` | boot, refresh tick |
| `scripts/serve.mjs` | static server (no dependencies) |
| `test/unit/`, `test/e2e/` | Vitest, Playwright |
