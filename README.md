# Pitch Oracle

ROLE
You are a senior frontend engineer and creative technologist with deep experience in React, Three.js / React Three Fiber, data visualization, and sports analytics UIs. Build production-quality code, not demos.

PROJECT
Build "PitchOracle" (working name): a 3D football match prediction web app. Users pick two teams and see an immersive 3D pitch that visualizes the predicted outcome (win / draw / loss probabilities, expected goals, likely scoreline) with cinematic, polished interactions.

TECH STACK
- React 18 + TypeScript + Vite
- React Three Fiber + @react-three/drei for the 3D scene
- Framer Motion for UI transitions, Zustand for state
- Tailwind CSS for the 2D interface
- Vitest for prediction-logic tests

CORE FEATURES
1. Team selection: searchable dual selector (home vs away) with crests, form (last 5 results), and league.
2. 3D pitch scene:
   - Stylized, realistic-looking pitch with line markings, floodlights, subtle stadium ambience, and orbit camera with damped controls
   - Team-colored player markers or abstract "energy zones" showing attacking/defensive strength across pitch areas (heatmap projected on the grass)
   - Animated ball that traces the predicted match narrative (e.g., a possession flow or shot-map) when the user hits "Simulate"
3. Prediction engine:
   - Model using a Poisson-based expected goals approach, with inputs: recent form, attack/defense strength, home advantage, head-to-head
   - Output: win/draw/loss %, most likely scoreline, top 5 scorelines with probabilities, and a confidence indicator
   - Keep the engine in a separate pure TypeScript module with unit tests, so the model can be swapped later
4. Results panel: animated probability bars, a scoreline matrix, and a short plain-language explanation of why the model favors a side
5. Data layer: start with a mock JSON dataset (16+ teams with realistic stats), behind a service interface so a real API (e.g., football-data.org) can be plugged in later

DESIGN DIRECTION
- Dark, cinematic "matchday night" aesthetic: deep navy/black, neon accent glow, glassmorphism panels
- Distinctive typography (a bold display face for headings, a clean sans for data); avoid generic template looks
- Smooth camera moves between "overview," "team A focus," and "team B focus" when the user selects a side
- Responsive: full 3D experience on desktop, simplified lighter scene on mobile
- Accessible: keyboard navigation, reduced-motion support, sufficient contrast, text alternatives for all probabilities

PERFORMANCE
- Target 60fps on mid-range laptops; use instancing, baked/simple lighting, lazy-loaded assets, and a quality toggle (low/med/high)
- Dispose of geometries and materials properly

HONESTY REQUIREMENT
Predictions are probabilistic estimates, not guarantees. Show a clear, unobtrusive disclaimer, and never present outputs as certain or as betting advice.

DELIVERY PROCESS
Work in stages and stop after each for my review:
1. Project structure, dependencies, and folder layout
2. Prediction engine + tests
3. Static 3D pitch scene with camera controls
4. UI layer and team selection wired to state
5. Prediction visualizations in 3D (heatmap, ball path, animations)
6. Polish: responsive behavior, performance pass, accessibility, README

For each stage: explain key decisions briefly, provide complete runnable code (no placeholders or "rest remains the same"), and list how to run and verify it.

Before starting, ask me up to 3 clarifying questions only if something essential is missing; otherwise state your assumptions and begin with stage 1.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/db7037a1-728d-4623-a08f-438a9798594b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
