# PitchOracle AI

PitchOracle AI is a football match intelligence platform for the 2026/27 Premier League and Champions League. It pairs a focused fixture portal with probabilistic previews that explain the model's view of each matchup.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The home page lists upcoming fixtures. Choose a competition and open a fixture to enter the match analyst. Adjust the teams and generate a forecast to see outcome probabilities, expected goals, and attacking pressure on the pitch.

Useful commands:

```sh
npm run build       # production build
npm run preview     # serve the production build locally
npm run test        # prediction engine tests
npm run lint        # ESLint
```

## What is included

- Upcoming Premier League Matchweek 6 fixtures and Champions League Matchday 2 fixtures involving Premier League clubs.
- Searchable club selectors, with Premier League teams listed first.
- A Poisson expected-goals model with win/draw/loss probabilities, likely scorelines, confidence, and explanatory factors.
- A client-rendered pitch view with camera controls and distinct home/away attacking-pressure zones. Zone intensity combines illustrative attack inputs with the model's expected goals; it is an explanation layer, not a prediction of exact events.
- Render-quality controls, a reduced scene on small screens, keyboard-operable controls, and reduced-motion support.

## Data and prediction limits

Club names and competition participants follow the 2026/27 season. The upcoming fixture list is a local snapshot based on published schedules as of 30 September 2026; kickoff dates and times may change. Times are displayed in the viewer's local timezone.

Team form, attack/defense ratings, expected goals, and the sample head-to-head input are illustrative mock values. They are not current club statistics. The mock service is the only data provider today and implements `FootballDataService`, so a live data provider can replace it without moving provider logic into the UI.

The 3D pitch is useful as a spatial explanation: it shows where the input profiles concentrate modeled attacking pressure and connects that picture to each side's expected goals. It does not simulate a real match or predict exact play sequences. Forecasts are probabilistic estimates, not guarantees or betting advice. Fair odds are model-implied values shown for information only.

## Project structure

```text
src/
  components/match/   fixture board, searchable team picker, forecast panel
  components/pitch/   React Three Fiber scene, stadium, pitch texture, forecast layers
  data/               club inputs and upcoming fixture snapshot
  lib/prediction/     pure TypeScript Poisson engine and Vitest tests
  routes/              fixture home page and client-only match route
  services/            FootballDataService interface and mock implementation
  store/               shared Zustand match state
  types/               football domain types and R3F JSX types
```

The project uses React 19 and TanStack Start with React Three Fiber 9. The match route is client-only because the 3D scene requires WebGL and browser APIs.

## Interaction

- Drag to orbit the camera, scroll to zoom, and right-drag to pan.
- Use Overview, Home focus, and Away focus to move the camera between views.
- Use Low, Medium, and High to choose scene quality. Small screens automatically cap pixel density, disable shadows, and omit decorative stadium geometry.
- The pitch opens to the upcoming fixture when no matchup is selected. It moves to a broad overview after a forecast is generated so the full pressure map is visible.
