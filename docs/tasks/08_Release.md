# Task 08 — Release Boundary

## Current Classification

- Local competition demo: Approved
- Public deployment: Blocked on product-owner GLB ownership/redistribution-license confirmation
- Real-data pilot: Not implemented or approved

## Build Evidence

- Lockfile present and clean install dependencies resolved
- Lint, TypeScript, 11 unit tests, and Next.js production build pass
- Full browser journey and 390 × 844 responsive Explore check pass without console errors
- Versioned local 3D assets and SHA-256 checksums recorded in `frontend/public/explore/ASSET_MANIFEST.md`

## Runbook

```powershell
cd frontend
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm run dev
```

No migration, backend, environment secret, or external provider is required for the local demo.
