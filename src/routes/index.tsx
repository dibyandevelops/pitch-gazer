import { createFileRoute } from "@tanstack/react-router";
import { TEAMS } from "@/data/teams";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PitchOracle — 3D football match predictions" },
      {
        name: "description",
        content:
          "Pick two teams and watch a cinematic 3D pitch visualise win, draw and loss probabilities, expected goals and the likeliest scorelines.",
      },
      { property: "og:title", content: "PitchOracle — 3D football match predictions" },
      {
        property: "og:description",
        content: "Poisson-based match forecasts visualised on an immersive 3D pitch.",
      },
    ],
  }),
  component: Home,
});

const STAGES = [
  { n: 1, label: "Project structure, dependencies, folder layout", state: "current" },
  { n: 2, label: "Prediction engine + unit tests", state: "next" },
  { n: 3, label: "Static 3D pitch scene with camera controls", state: "next" },
  { n: 4, label: "UI layer and team selection wired to state", state: "next" },
  { n: 5, label: "Prediction visualisations in 3D", state: "next" },
  { n: 6, label: "Responsive, performance, accessibility, README", state: "next" },
] as const;

function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-6 py-16">
      <header className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">Stage 1 of 6</p>
        <h1 className="text-5xl leading-none text-foreground text-glow sm:text-7xl">
          Pitch<span className="text-primary">Oracle</span>
        </h1>
        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          Foundations are in place: design system, typed domain model, swappable data service and
          shared match state. The 3D pitch and prediction engine land in the next stages.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Teams in mock dataset" value={String(TEAMS.length)} />
        <Stat label="Leagues" value={String(new Set(TEAMS.map((t) => t.league)).size)} />
        <Stat label="Engine" value="Poisson xG" />
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Delivery plan</h2>
        <ol className="mt-4 space-y-3">
          {STAGES.map((s) => (
            <li key={s.n} className="flex items-center gap-4 text-sm">
              <span
                className={
                  s.state === "current"
                    ? "grid size-7 place-items-center rounded-full bg-primary font-mono text-xs text-primary-foreground"
                    : "grid size-7 place-items-center rounded-full border border-border font-mono text-xs text-muted-foreground"
                }
              >
                {s.n}
              </span>
              <span className={s.state === "current" ? "text-foreground" : "text-muted-foreground"}>
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-xs text-muted-foreground">
        PitchOracle outputs are probabilistic estimates from a statistical model — not predictions of
        certainty and not betting advice.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel p-5">
      <p className="font-mono text-3xl text-primary">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    </div>
  );
}
