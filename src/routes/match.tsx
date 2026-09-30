import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState } from "react";
import { ArrowLeftRight, Sparkles, Waves } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { TeamPicker } from "@/components/match/TeamPicker";
import { PredictionPanel } from "@/components/match/PredictionPanel";
import { predictMatch } from "@/lib/prediction/engine";
import { footballService } from "@/services/footballService";
import { saveRecentForecast } from "@/services/forecastHistory";
import { useMatchStore, type CameraFocus, type QualityLevel } from "@/store/useMatchStore";

const PitchScene = lazy(() => import("@/components/pitch/PitchScene"));

export const Route = createFileRoute("/match")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Match forecast — PitchOracle AI" },
      {
        name: "description",
        content:
          "Explore how modeled attack profiles and expected goals shape a probabilistic football forecast.",
      },
      { property: "og:title", content: "Match forecast — PitchOracle AI" },
      {
        property: "og:description",
        content: "A probability-led forecast with an explorable attacking-pressure view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatchPage,
});

const FOCUS: { id: CameraFocus; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "home", label: "Home focus" },
  { id: "away", label: "Away focus" },
];
const QUALITY: QualityLevel[] = ["low", "medium", "high"];

function MatchPage() {
  const { teams, homeId, awayId, prediction, isSimulating, focus, quality } = useMatchStore(
    useShallow((s) => ({
      teams: s.teams,
      homeId: s.homeId,
      awayId: s.awayId,
      prediction: s.prediction,
      isSimulating: s.isSimulating,
      focus: s.focus,
      quality: s.quality,
    })),
  );
  const {
    setTeams,
    setHome,
    setAway,
    swapSides,
    setPrediction,
    setSimulating,
    setFocus,
    setQuality,
    animatePressure,
  } = useMatchStore();
  const [loadError, setLoadError] = useState(false);
  const [predictError, setPredictError] = useState("");
  const home = teams.find((team) => team.id === homeId);
  const away = teams.find((team) => team.id === awayId);
  const canPredict = Boolean(home && away && home.id !== away.id && !isSimulating);

  useEffect(() => {
    let active = true;
    setFocus("overview");
    Promise.all([
      footballService.listTeams(),
      footballService.listUpcomingFixtures("Premier League"),
    ])
      .then(([loadedTeams, fixtures]) => {
        if (!active) return;
        setTeams(loadedTeams);
        if (
          loadedTeams.length > 1 &&
          !useMatchStore.getState().homeId &&
          !useMatchStore.getState().awayId
        ) {
          const firstFixture = fixtures[0];
          setHome(firstFixture?.homeId ?? loadedTeams[0]!.id);
          setAway(firstFixture?.awayId ?? loadedTeams[1]!.id);
          setFocus("overview");
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, [setTeams, setHome, setAway, setFocus]);

  const createPrediction = async () => {
    if (!home || !away || home.id === away.id) return;
    setPredictError("");
    setSimulating(true);
    try {
      const headToHead = await footballService.getHeadToHead(home.id, away.id);
      const nextPrediction = predictMatch({
        home,
        away,
        ...(headToHead ? { headToHead } : {}),
      });
      setPrediction(nextPrediction);
      saveRecentForecast(home, away, nextPrediction);
      setFocus("overview");
    } catch {
      setPredictError("We couldn't create this forecast. Please try again.");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <main className="fixed inset-0 bg-background">
      <Suspense
        fallback={
          <div className="grid h-full place-items-center text-muted-foreground">
            Loading stadium…
          </div>
        }
      >
        <PitchScene />
      </Suspense>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 hidden items-start justify-end p-4 sm:flex sm:p-6">
        <div
          className="glass-panel pointer-events-auto flex gap-1 p-1 text-xs"
          role="group"
          aria-label="Render quality"
        >
          {QUALITY.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              aria-pressed={quality === q}
              className={`rounded-md px-3 py-1.5 capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${quality === q ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {q}
            </button>
          ))}
        </div>
      </header>

      <aside
        className="glass-panel absolute inset-x-3 top-3 bottom-[calc(env(safe-area-inset-bottom)+6rem)] z-10 flex flex-col overflow-hidden sm:inset-y-5 sm:left-5 sm:right-auto sm:w-[min(25rem,calc(100vw-2.5rem))]"
        aria-label="Match setup and forecast"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2.5 sm:px-4 sm:py-3">
          <Link
            to="/"
            className="text-xl text-foreground text-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="PitchOracle AI home"
          >
            Pitch<span className="text-primary">Oracle</span>
            <span className="ml-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-primary">
              AI
            </span>
          </Link>
          <div
            className="glass-panel flex gap-0.5 p-0.5 text-[9px] sm:hidden"
            role="group"
            aria-label="Render quality"
          >
            {QUALITY.map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                aria-pressed={quality === q}
                className={`rounded-md px-2 py-1 capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${quality === q ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {q === "medium" ? "med" : q}
              </button>
            ))}
          </div>
          <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-2 py-1 font-mono text-[8px] tracking-[0.18em] text-primary sm:inline-flex">
            MATCH FORECAST
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-4">
            <p className="font-mono text-[9px] tracking-[0.24em] text-primary">MATCH FORECAST</p>
            <h1 className="mt-1 text-xl text-foreground">Explore a matchup</h1>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Choose two clubs to see how their modeled attack and defense translate into win, draw,
              and loss probabilities.
            </p>
            <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground">
              Club names reflect the 2026/27 competitions. Form and performance figures are
              illustrative mock inputs, not live statistics.
            </p>
          </div>

          {loadError ? (
            <p
              role="alert"
              className="mb-3 rounded-lg border border-rose-300/20 bg-rose-400/10 p-3 text-xs text-rose-200"
            >
              Team data couldn't load. Refresh to try again.
            </p>
          ) : null}
          <div className="space-y-3">
            <TeamPicker side="HOME" teams={teams} selected={home} onSelect={setHome} />
            <div className="flex items-center gap-3 pl-2">
              <div className="h-px flex-1 bg-white/10" />
              <button
                type="button"
                onClick={swapSides}
                disabled={!homeId || !awayId}
                aria-label="Swap home and away teams"
                className="grid size-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeftRight size={14} />
              </button>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <TeamPicker side="AWAY" teams={teams} selected={away} onSelect={setAway} />
          </div>

          {home && away && home.id === away.id ? (
            <p className="mt-3 text-[10px] text-amber-200">
              Choose a different club for each side.
            </p>
          ) : null}
          <button
            type="button"
            onClick={createPrediction}
            disabled={!canPredict}
            aria-busy={isSimulating}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.2)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles size={14} />{" "}
            {isSimulating
              ? "Calculating forecast…"
              : prediction
                ? "Refresh forecast"
                : "Generate forecast"}
          </button>
          {predictError ? (
            <p role="alert" className="mt-2 text-[10px] text-rose-200">
              {predictError}
            </p>
          ) : null}

          {prediction && home && away ? (
            <>
              <div
                className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-white/8 bg-white/[0.035] px-3 py-2"
                aria-label="Pitch heatmap colors"
              >
                <span className="font-mono text-[8px] tracking-[0.14em] text-muted-foreground">
                  3D MODEL VIEW · ATTACK PRESSURE
                </span>
                <span className="flex items-center gap-1.5 text-[9px] text-foreground/80">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: "#54e89a",
                      boxShadow: "0 0 8px #54e89a",
                    }}
                  />
                  {home.shortName}
                </span>
                <span className="flex items-center gap-1.5 text-[9px] text-foreground/80">
                  <span
                    className="size-2 rounded-full"
                    style={{
                      backgroundColor: "#67c9ff",
                      boxShadow: "0 0 8px #67c9ff",
                    }}
                  />
                  {away.shortName}
                </span>
                <p className="w-full text-[9px] leading-relaxed text-muted-foreground">
                  Brighter zones indicate stronger modeled attacks, shaped by each club’s profile
                  and expected goals. This adds spatial context to the forecast; it is not a
                  play-by-play.
                </p>
              </div>
              <button
                type="button"
                onClick={animatePressure}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-[10px] font-medium text-primary transition hover:border-primary/50 hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Animate the modeled attacking pressure zones on the 3D pitch"
              >
                <Waves size={13} className="motion-safe:animate-pulse" aria-hidden="true" />
                <span>Animate pressure zones</span>
                <span className="sr-only"> on the pitch</span>
              </button>
              <PredictionPanel
                key={`${home.id}-${away.id}`}
                prediction={prediction}
                home={home}
                away={away}
              />
            </>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-white/12 px-4 py-5 text-center">
              <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                READY WHEN YOU ARE
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                Generate a forecast to see outcome chances, expected goals and the likeliest score.
              </p>
            </div>
          )}
        </div>
      </aside>

      <nav
        className="glass-panel absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-10 flex -translate-x-1/2 gap-1 p-1 text-xs sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 sm:text-sm"
        aria-label="Camera views"
      >
        {FOCUS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFocus(f.id)}
            aria-pressed={focus === f.id}
            className={`rounded-md px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${focus === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </nav>
      <p className="pointer-events-none absolute bottom-[4.5rem] right-6 hidden text-right text-[10px] text-muted-foreground sm:block">
        Drag to orbit · scroll to zoom · right-drag to pan
      </p>
    </main>
  );
}
