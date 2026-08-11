# SleepOS frontend

Next.js App Router application for the SleepOS competition demo.

## Local development

```powershell
npm install
npm run dev
```

The typed synthetic Alex profile lives in `src/lib/demo-data.ts`. The root layout provides the five-destination shell, wellness disclaimer, and shared Plan provider. Feature modules remain route-local so Explore and its 3D asset never enter the Home critical bundle.

## Explore model boundary

Explore preserves the supplied BodyParts3D body and smooth v6 skin as the canonical human. Brain, heart, lungs, and gut map to verified model layers. The supplied asset has no verified muscle or metabolic geometry, so `muscle_recovery` and `metabolic_labs` remain explicitly labeled regional context. They must not be presented as precise anatomical selections until approved geometry is supplied.

The script-only sandboxed viewer now loads versioned Three.js/GSAP code and both GLBs from `public/explore/`. SHA-256 checksums and supplied origins are recorded in `public/explore/ASSET_MANIFEST.md`. Product-owner confirmation of the GLB ownership and redistribution license remains required before public production.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before integration.
