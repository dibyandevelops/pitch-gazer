# PitchOracle AI

PitchOracle AI is a football match intelligence platform for the 2026/27 Premier League and Champions League. It pairs a focused fixture portal with probabilistic previews that explain the model's view of each matchup.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The home page lists upcoming fixtures and links to live scores. Open a fixture to enter the match analyst. Adjust the teams and generate a forecast to see outcome probabilities, expected goals, and attacking pressure on the pitch.

### Real player scorer estimates

The live score centre and match forecast use API-Football for real-time scores and player statistics. Create an account at [API-Football](https://www.api-football.com/), subscribe to a plan with the required competition and season coverage, then copy the API key shown in your account dashboard. The free plan currently lists 100 requests per day and has season coverage limits, so verify that its coverage matches the data you need.

For local development, copy `.env.example` to `.env.local` and set `API_FOOTBALL_KEY` to your key. Never prefix it with `VITE_` and never put the key in client code. For Vercel, open the project's **Settings → Environment Variables**, add `API_FOOTBALL_KEY`, mark it sensitive where available, and select Preview and Production. Redeploy after saving. `FOOTBALL_SEASON` is optional and defaults to the current UTC year; set it to the season year if the provider's active season differs.

The API key is read by server routes only. When it is not configured, forecasts continue to work while the live score and scorer sections explain why provider data is unavailable. Scorer estimates allocate the model's team expected goals across players in proportion to their current-season goals per minute, then convert that share to an anytime-scorer probability. Early-season samples are noisy; these are uncertain estimates and do not establish who will start.

Useful commands:

```sh
npm run build       # production build
npm run preview     # serve the production build locally
npm run test        # prediction engine tests
npm run lint        # ESLint
```

## What is included

- Upcoming Premier League Matchweek 6 fixtures and Champions League Matchday 2 fixtures involving Premier League clubs.
- A live score centre for Premier League and Champions League matches, with competition filters, manual refresh, and two-minute foreground polling to conserve API quota.
- Searchable club selectors, with Premier League teams listed first.
- A Poisson expected-goals model with win/draw/loss probabilities, likely scorelines, confidence, and explanatory factors.
- A client-rendered, full-pitch tactical view with camera controls and distinct home/away attacking-pressure zones. Zone intensity combines illustrative attack inputs with the model's expected goals; it is an explanation layer, not a prediction of exact events.
- Render-quality controls, a reduced scene on small screens, keyboard-operable controls, and reduced-motion support.

## Data and prediction limits

Club names and competition participants follow the 2026/27 season. The upcoming fixture list is a local snapshot based on published schedules as of 30 September 2026; kickoff dates and times may change. Times are displayed in the viewer's local timezone.

Team form, attack/defense ratings, expected goals, and the sample head-to-head input remain illustrative mock values; they are not current club statistics. The fixture/team service implements `FootballDataService`. Separate server-only API-Football routes supply live scores and optional player data without exposing the key to the browser.

The 3D pitch is useful as a spatial explanation: it shows where the input profiles concentrate modeled attacking pressure and connects that picture to each side's expected goals. It does not simulate a real match or predict exact play sequences. The zones are model estimates, not observed player locations, passes, or shots. Forecasts are probabilistic estimates, not guarantees or betting advice. Fair odds are model-implied values shown for information only.

## Subscription direction

Treat subscriptions as a later product layer, after real data and accounts are in place. A reasonable first offer would keep fixture browsing and a small daily allowance of basic forecasts free, with a paid tier for higher forecast limits, cross-device saved analysis history, matchup comparisons, and configurable fixture alerts. Keep the core probabilities and uncertainty explanation visible to everyone. The current app uses mock inputs and stores history only in the browser, so a paywall should wait until the product has reliable licensed data, account-backed storage, and server-side usage enforcement. Pricing should follow those data and infrastructure costs rather than be guessed now.

## Project structure

```text
src/
  components/match/   fixture board, searchable team picker, forecast panel
  components/pitch/   React Three Fiber scene, stadium, pitch texture, forecast layers
  data/               club inputs and upcoming fixture snapshot
  lib/prediction/     pure TypeScript Poisson engine and Vitest tests
  routes/              fixture home, live score API/page, scorer API, and match route
  services/            mock fixture service and server-only API-Football providers
  store/               shared Zustand match state
  types/               football domain types and R3F JSX types
```

The project uses React 19 and TanStack Start with React Three Fiber 9. The match route is client-only because the 3D scene requires WebGL and browser APIs.

## Interaction

- Drag to orbit the camera, scroll to zoom, and right-drag to pan.
- Use Fit pitch, Home focus, and Away focus to move the camera between views.
- Use Low, Medium, and High to choose scene quality. The full-pitch view omits stadium structures that compete with the forecast; small screens cap pixel density and disable shadows.
- The pitch opens to the upcoming fixture when no matchup is selected. It moves to a broad overview after a forecast is generated so the full pressure map is visible.
