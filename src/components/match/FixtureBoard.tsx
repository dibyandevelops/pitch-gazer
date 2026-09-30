import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RadioTower,
  Sparkles,
} from "lucide-react";
import { predictMatch } from "@/lib/prediction/engine";
import { footballService } from "@/services/footballService";
import { getRecentForecasts, type RecentForecast } from "@/services/forecastHistory";
import { useMatchStore } from "@/store/useMatchStore";
import type { Competition, Team, UpcomingFixture } from "@/types/football";
import { TeamCrest } from "./TeamPicker";

const COMPETITIONS: { id: Competition; label: string; short: string }[] = [
  { id: "Premier League", label: "Premier League", short: "PL" },
  { id: "Champions League", label: "Champions League", short: "UCL" },
];

export function FixtureBoard() {
  const [competition, setCompetition] = useState<Competition>("Premier League");
  const [fixtures, setFixtures] = useState<UpcomingFixture[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [recentForecasts, setRecentForecasts] = useState<RecentForecast[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { setTeams: storeTeams, setHome, setAway, setFocus, setPrediction } = useMatchStore();

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setRecentForecasts(getRecentForecasts());
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    Promise.all([footballService.listTeams(), footballService.listUpcomingFixtures(competition)])
      .then(([loadedTeams, loadedFixtures]) => {
        if (!active) return;
        setTeams(loadedTeams);
        storeTeams(loadedTeams);
        setFixtures(loadedFixtures);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [competition, storeTeams]);

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const nextKickoff = fixtures[0]?.kickoff;
  const featuredFixtures = useMemo(() => {
    const now = new Date();
    const today = dateKey(now, timezone);
    const upcoming = fixtures.filter(
      (fixture) => new Date(fixture.kickoff).getTime() >= now.getTime(),
    );
    const todayFixtures = upcoming.filter(
      (fixture) => dateKey(new Date(fixture.kickoff), timezone) === today,
    );
    if (todayFixtures.length) return { fixtures: todayFixtures, isToday: true };
    const next = upcoming[0];
    if (!next) return { fixtures: [], isToday: false };
    const nextDate = dateKey(new Date(next.kickoff), timezone);
    return {
      fixtures: upcoming.filter(
        (fixture) => dateKey(new Date(fixture.kickoff), timezone) === nextDate,
      ),
      isToday: false,
    };
  }, [fixtures, timezone]);
  const currentFeatured = featuredFixtures.fixtures[featuredIndex];
  const currentHome = currentFeatured ? teamById.get(currentFeatured.homeId) : undefined;
  const currentAway = currentFeatured ? teamById.get(currentFeatured.awayId) : undefined;
  const featuredPrediction =
    currentHome && currentAway ? predictMatch({ home: currentHome, away: currentAway }) : undefined;

  useEffect(() => {
    setFeaturedIndex(0);
  }, [competition, featuredFixtures.fixtures.length]);

  useEffect(() => {
    if (paused || featuredFixtures.fixtures.length < 2) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;
    const timer = window.setInterval(() => {
      setFeaturedIndex((index) => (index + 1) % featuredFixtures.fixtures.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [featuredFixtures.fixtures.length, paused]);

  return (
    <main className="min-h-screen bg-background px-4 pb-12 pt-5 sm:px-8 sm:pt-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="text-2xl text-foreground text-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="PitchOracle AI fixtures home"
          >
            Pitch<span className="text-primary">Oracle</span>
            <span className="ml-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-primary">
              AI
            </span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <Link
              to="/live"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 text-xs text-rose-100 transition hover:border-rose-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4"
            >
              <span
                className="size-2 rounded-full bg-rose-400 motion-safe:animate-pulse"
                aria-hidden="true"
              />
              Live scores
            </Link>
            <Link
              to="/match"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4"
            >
              Match analyst <ArrowUpRight size={14} />
            </Link>
          </nav>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/50 px-5 py-7 sm:mt-12 sm:px-9 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-24 size-80 rounded-full bg-emerald-400/10 blur-3xl"
          />
          <div className="relative max-w-3xl">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-primary">
              <RadioTower size={13} /> FOOTBALL INTELLIGENCE · 2026/27
            </div>
            <h1 className="mt-3 text-3xl leading-tight text-foreground sm:text-5xl">
              The next matches,
              <br className="hidden sm:block" /> seen differently.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Browse upcoming Premier League fixtures and Champions League matches featuring this
              season’s English clubs. Start with the probabilities, then use the pitch to see where
              modeled attacking pressure comes from.
            </p>
          </div>
          <div className="relative mt-7 flex flex-wrap items-end justify-between gap-4">
            <div
              className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1"
              role="group"
              aria-label="Competition"
            >
              {COMPETITIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={competition === item.id}
                  onClick={() => setCompetition(item.id)}
                  className={`rounded-lg px-4 py-2 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-5 ${competition === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span className="sm:hidden">{item.short}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              ))}
            </div>
            {nextKickoff ? (
              <div className="text-right">
                <p className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">
                  NEXT KICKOFF · YOUR TIME
                </p>
                <p className="mt-1 text-xs text-foreground">
                  {formatKickoff(nextKickoff, timezone)}
                </p>
              </div>
            ) : null}
          </div>
        </section>

        {recentForecasts.length > 0 ? (
          <section className="mt-8" aria-labelledby="recent-forecasts-heading">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[9px] tracking-[0.22em] text-primary">
                  YOUR ANALYSIS HISTORY
                </p>
                <h2 id="recent-forecasts-heading" className="mt-1 text-xl text-foreground">
                  Recent forecasts
                </h2>
              </div>
              <span className="text-[10px] text-muted-foreground">Saved on this device</span>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {recentForecasts.map((forecast) => (
                <Link
                  key={forecast.id}
                  to="/match"
                  onClick={() => {
                    storeTeams(teams);
                    setHome(forecast.homeId);
                    setAway(forecast.awayId);
                    setFocus("overview");
                    setPrediction(forecast.prediction);
                  }}
                  className="glass-panel flex items-center justify-between gap-3 p-3 transition hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Reopen forecast ${forecast.homeName} versus ${forecast.awayName}, likeliest score ${forecast.homeGoals} to ${forecast.awayGoals}`}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-xs font-medium text-foreground">
                      {teamById.get(forecast.homeId) ? (
                        <TeamCrest team={teamById.get(forecast.homeId)!} small />
                      ) : null}
                      <span className="truncate">{forecast.homeShortName}</span>
                      <span className="text-muted-foreground">vs</span>
                      <span className="truncate">{forecast.awayShortName}</span>
                      {teamById.get(forecast.awayId) ? (
                        <TeamCrest team={teamById.get(forecast.awayId)!} small />
                      ) : null}
                    </p>
                    <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                      {Math.round(forecast.homeWin * 100)}% · {Math.round(forecast.draw * 100)}% ·{" "}
                      {Math.round(forecast.awayWin * 100)}% W/D/L
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-lg text-primary">
                      {forecast.homeGoals}–{forecast.awayGoals}
                    </p>
                    <p className="text-[8px] text-muted-foreground">
                      {formatForecastDate(forecast.createdAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {!loading &&
        !error &&
        currentFeatured &&
        currentHome &&
        currentAway &&
        featuredPrediction ? (
          <section className="mt-8" aria-labelledby="today-forecast-heading">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.22em] text-primary">
                  <Sparkles size={12} />{" "}
                  {featuredFixtures.isToday
                    ? "TODAY · MODEL FORECAST"
                    : "NEXT MATCHDAY · MODEL FORECAST"}
                </p>
                <h2 id="today-forecast-heading" className="mt-1 text-xl text-foreground">
                  {featuredFixtures.isToday ? "Today’s match predictions" : "Coming up next"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="mr-1 font-mono text-[9px] text-muted-foreground">
                  {featuredIndex + 1} / {featuredFixtures.fixtures.length}
                </span>
                {featuredFixtures.fixtures.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setFeaturedIndex(
                          (i) =>
                            (i - 1 + featuredFixtures.fixtures.length) %
                            featuredFixtures.fixtures.length,
                        )
                      }
                      className="grid size-9 place-items-center rounded-full border border-white/10 text-foreground transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Previous match forecast"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaused((value) => !value)}
                      className="grid size-9 place-items-center rounded-full border border-white/10 text-foreground transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label={paused ? "Resume forecast carousel" : "Pause forecast carousel"}
                    >
                      {paused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFeaturedIndex((i) => (i + 1) % featuredFixtures.fixtures.length)
                      }
                      className="grid size-9 place-items-center rounded-full border border-white/10 text-foreground transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Next match forecast"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <Link
              to="/match"
              onClick={() => {
                storeTeams(teams);
                setHome(currentHome.id);
                setAway(currentAway.id);
                setFocus("overview");
                setPrediction(featuredPrediction);
              }}
              className="group glass-panel block overflow-hidden border-primary/15 p-4 transition hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-6"
              aria-label={`Open forecast: ${currentHome.name} versus ${currentAway.name}. Most likely score ${featuredPrediction.mostLikely.homeGoals} to ${featuredPrediction.mostLikely.awayGoals}.`}
              aria-roledescription="slide"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={12} className="text-primary" />
                  {formatKickoff(currentFeatured.kickoff, timezone)} · {currentFeatured.round}
                </span>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-[9px] tracking-wide text-primary">
                  {currentFeatured.competition}
                </span>
              </div>
              <div className="mt-5 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="text-right text-sm font-medium text-foreground sm:text-base">
                    {currentHome.name}
                  </span>
                  <TeamCrest team={currentHome} />
                </div>
                <div className="text-center">
                  <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
                    LIKELIEST SCORE
                  </p>
                  <p className="mt-0.5 font-mono text-3xl text-primary">
                    {featuredPrediction.mostLikely.homeGoals}
                    <span className="px-2 text-muted-foreground">–</span>
                    {featuredPrediction.mostLikely.awayGoals}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TeamCrest team={currentAway} />
                  <span className="text-sm font-medium text-foreground sm:text-base">
                    {currentAway.name}
                  </span>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-white/8 bg-black/15 p-3 text-center">
                <Probability
                  label={`${currentHome.shortName} win`}
                  value={featuredPrediction.homeWin}
                />
                <Probability label="Draw" value={featuredPrediction.draw} />
                <Probability
                  label={`${currentAway.shortName} win`}
                  value={featuredPrediction.awayWin}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span>
                  Confidence: {featuredPrediction.confidence} · {featuredPrediction.confidenceScore}
                  /100
                </span>
                <span className="inline-flex items-center gap-1 text-primary transition group-hover:gap-2">
                  Explore full forecast <ChevronRight size={12} />
                </span>
              </div>
            </Link>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Estimates use illustrative club statistics in this fixture snapshot. They are
              uncertain and are not live-data predictions or betting advice.
            </p>
          </section>
        ) : null}

        <section className="mt-8" aria-labelledby="fixtures-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] tracking-[0.22em] text-primary">
                {competition === "Premier League" ? "MATCHWEEK 6" : "LEAGUE PHASE · MATCHDAY 2"}
              </p>
              <h2 id="fixtures-heading" className="mt-1 text-2xl text-foreground">
                Upcoming {competition} matches
              </h2>
            </div>
            <span className="hidden text-xs text-muted-foreground sm:block">
              {fixtures.length} fixtures
            </span>
          </div>

          {loading ? (
            <div className="glass-panel grid min-h-48 place-items-center text-sm text-muted-foreground">
              Loading fixtures…
            </div>
          ) : null}
          {error ? (
            <p role="alert" className="glass-panel p-6 text-sm text-rose-200">
              Fixtures are temporarily unavailable. Please try again.
            </p>
          ) : null}
          {!loading && !error && fixtures.length === 0 ? (
            <div className="glass-panel p-8 text-center text-sm text-muted-foreground">
              No upcoming fixtures are available right now.
            </div>
          ) : null}
          {!loading && !error ? (
            <div className="grid gap-3 md:grid-cols-2">
              {fixtures.map((fixture, index) => {
                const home = teamById.get(fixture.homeId);
                const away = teamById.get(fixture.awayId);
                if (!home || !away) return null;
                return (
                  <Link
                    key={fixture.id}
                    to="/match"
                    onClick={() => {
                      setHome(home.id);
                      setAway(away.id);
                      setFocus("overview");
                    }}
                    className="group glass-panel block p-4 transition duration-200 motion-safe:hover:-translate-y-0.5 hover:border-primary/25 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
                    aria-label={`Explore prediction for ${home.name} versus ${away.name}, ${formatKickoff(fixture.kickoff, timezone)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.14em] text-muted-foreground">
                        <CalendarDays size={12} className="text-primary" />
                        {fixture.round.toUpperCase()}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatKickoff(fixture.kickoff, timezone)}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <TeamCrest team={home} small />
                        <span className="truncate text-xs font-medium text-foreground sm:text-sm">
                          {home.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground">VS</span>
                      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
                        <span className="truncate text-right text-xs font-medium text-foreground sm:text-sm">
                          {away.name}
                        </span>
                        <TeamCrest team={away} small />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-[10px] text-muted-foreground">
                      <span>
                        {fixture.competition === "Champions League"
                          ? "Premier League club in Europe"
                          : "Premier League · model preview"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-primary opacity-80 transition group-hover:opacity-100">
                        View forecast <ChevronRight size={12} />
                      </span>
                    </div>
                    <span className="sr-only">Fixture {index + 1}</span>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </section>

        <footer className="mt-8 flex flex-col gap-2 border-t border-white/8 pt-4 text-[10px] leading-relaxed text-muted-foreground sm:flex-row sm:justify-between">
          <span>Fixture dates and times follow official 2026/27 schedules and may change.</span>
          <span>
            Club form and model statistics are illustrative mock inputs, not live data or betting
            advice.
          </span>
        </footer>
      </div>
    </main>
  );
}

function formatKickoff(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

function formatForecastDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function dateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function Probability({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-base text-foreground sm:text-lg">{Math.round(value * 100)}%</p>
      <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{label}</p>
    </div>
  );
}
