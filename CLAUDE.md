# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**A Tauri 2 desktop app** (Rust shell + React/Vite webview) targeting Windows primarily. SQLite is the persistence layer — bundled inside the binary via `tauri-plugin-sql`. End users install a single `.msi`/`.exe` produced by GitHub Actions; no Node, Rust, or SQLite runtime needed on the target machine.

## Commands

Frontend-only (browser, won't have DB access — useful for UI iteration only):
- `npm run dev` — Vite dev server (port 5173, strict)
- `npm run build` — Vite production build → `dist/`
- `npm run lint` — ESLint flat config

Full app (Vite + Tauri webview):
- `npm run tauri:dev` — runs Vite + opens the Tauri window with hot reload
- `npm run tauri:build` — produces installers under `src-tauri/target/release/bundle/`

TypeScript is `strict` with `noUnusedLocals` + `noUnusedParameters` — unused identifiers fail the build. No test runner.

## Architecture

React 18 + Vite + Tailwind, wrapped in Tauri 2. Three routes via `react-router-dom` ([src/App.tsx](src/App.tsx)):
- `/` → [Home](src/pages/Home.tsx) (landing)
- `/add` → [RegistrationForm](src/components/RegistrationForm.tsx)
- `/registrations` → [RegistrationList](src/components/RegistrationList.tsx) (list/search/filter/delete/export)

### Persistence

SQLite database at `<APPDATA>/com.badstephane.gestion-inscription/inscriptions.db` (auto-created on first launch). Schema is defined as Rust migrations in [src-tauri/src/lib.rs](src-tauri/src/lib.rs); JS code never creates tables.

DB access goes through three layers:
- [src/utils/db.ts](src/utils/db.ts) — singleton `Database.load('sqlite:inscriptions.db')` promise
- [src/utils/storage.ts](src/utils/storage.ts) — `getRegistrations` / `addRegistration` / `deleteRegistration`, all `async`. Maps SQL snake_case (`first_name`, `created_at`) ↔ TS camelCase (`firstName`, `createdAt`).
- [src/utils/dbBackup.ts](src/utils/dbBackup.ts) — `exportDatabase` / `importDatabase` (raw `.db` file copy via `plugin-fs` + `plugin-dialog`). Import closes the DB and the caller must `window.location.reload()`.

**Adding a column or table = new migration entry in lib.rs**, never an in-flight `CREATE TABLE` from JS. Migrations are append-only and versioned.

### Domain

Single type `Registration` ([src/types/index.ts](src/types/index.ts)). `paymentType: 'wave' | 'cash'` — "Wave" is the mobile-money service used in West Africa, paired with cash ("Espèce"). The check constraint in the migration enforces this union — extending it requires a migration AND updating both form and list UI.

Excel export ([src/utils/excelExport.ts](src/utils/excelExport.ts)) consumes the *filtered* registrations passed by the list component, not the full set — search/filter state therefore determines exported rows.

## Tauri configuration

- Identifier: `com.badstephane.gestion-inscription` ([src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)) — changing it breaks existing installs (different appdata folder, DB appears empty).
- Permissions live in [src-tauri/capabilities/default.json](src-tauri/capabilities/default.json). The SQL plugin permissions are scoped to `sqlite:inscriptions.db` — adding a second DB requires extending those `allow` lists.
- `fs:scope` allows reading/writing in `$APPDATA`, `$DOCUMENT`, `$DESKTOP`, `$DOWNLOAD`, `$HOME` so users can save backup `.db` files anywhere reasonable.

## Build & release

[.github/workflows/build-windows.yml](.github/workflows/build-windows.yml) runs on `windows-latest` for every push to `main`, every `v*` tag, and manual dispatch. It produces `.msi` (WiX) + `.exe` (NSIS) artifacts; tagged builds also attach to a GitHub Release. Local `tauri build` on macOS produces `.app`/`.dmg` but the project is not configured for macOS distribution.

## Conventions

- UI is entirely **French** — keep all user-facing strings, labels, errors, and Excel headers in French.
- Tailwind utilities inline in JSX. No component library, no shared style module beyond [src/index.css](src/index.css).
- `lucide-react` is excluded from Vite's `optimizeDeps` ([vite.config.ts](vite.config.ts)) — keep it that way; it works around an icon-import issue in dev.
- Storage operations are `async`. Components await results and handle the loading state explicitly — never wrap them in `useEffect` without a cancellation guard.
