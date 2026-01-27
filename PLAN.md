# Architecture Consolidation Plan

## Context
The project is currently in a "Frankenstein" state with three competing backend architectures and a disorganized frontend.
- **Backend 1 (Active)**: `server/` (Express + Raw SQL). This is the one running.
- **Backend 2 (Ghost)**: `src/` (Fastify + Zod). Incomplete, misplaced in `src`.
- **Backend 3 (Legacy)**: `backend/` (Express + Prisma). Dormant.
- **Frontend**: Scatters in root (`components/`, `pages/`, `main.tsx`).

## Objective
Consolidate the architecture to a standard Web App structure:
- **Frontend**: React/Vite in `src/`.
- **Backend**: Express in `server/`.
- **Legacy**: Archive unused code.

## Steps

### Phase 1: Structural Sanitization (Immediate)
- [x] Create `PLAN.md`.
- [ ] Rename `src` (Ghost Backend) to `src_fastify_backup`.
- [ ] Create new `src` directory for Frontend.
- [ ] Move Frontend assets (`components`, `pages`, `lib`, `main.tsx`, `Layout.jsx`, `index.css`) to `src/`.
- [ ] Update `index.html` to point to `/src/main.tsx`.
- [ ] Update `vite.config.js` and `tsconfig.json` to reflect new structure and `@` alias.

### Phase 2: Backend Stabilization
- [ ] Verify `server/` routes exist and are functional.
- [ ] Investigate `ClinicSettings` 400 error.
- [ ] Investigate `invites/process` 500 error.
- [ ] Sync `package.json` scripts to strictly use `server/index.js`.

### Phase 3: Database & Schema
- [ ] Align Prisma schema with `server/index.js` `initSchema` logic.
- [ ] Ensure migrations are safe.

## Constraints
- Do not break `server/index.js` (the currently running backend).
- Ensure `npm run dev` works after reorganization.
