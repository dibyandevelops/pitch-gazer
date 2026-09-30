## PitchOracle AI architecture rules

- Do not force-push or rewrite published Git history. Keep commits on the connected branch in a working state because they may sync to external project tooling.

- Prediction logic lives in `src/lib/prediction/` as pure TypeScript with Vitest tests, so the model can be swapped without touching UI. Tests run with `bun run test`.
- All football data is read through the `FootballDataService` interface in `src/services/footballService.ts` (mock impl today), so a real API can replace it in one file.
- Shared match state (teams, selection, prediction, quality, camera focus) lives in the Zustand store `src/store/useMatchStore.ts`; the 3D scene and DOM UI both read from it rather than passing props across the canvas boundary.
- 3D code lives in `src/components/pitch/` and mounts only on a client-only route (`ssr: false`) because R3F cannot server-render.
- Domain types live in `src/types/football.ts`; `src/types/r3f.d.ts` loads the fiber JSX augmentation globally.
- Stack note: this project runs TanStack Start + React 19 (fiber 9 / drei 10) rather than the originally requested React 18 Vite SPA, since the router and SSR entry are fixed by the platform.
