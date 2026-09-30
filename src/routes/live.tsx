import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpRight, Clock3, LoaderCircle, Radio, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import type { Competition } from "@/types/football";
import type { LiveMatch } from "@/services/liveScores.server";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live scores — PitchOracle AI" },
      {
        name: "description",
        content: "Follow live Premier League and Champions League scores and match status.",
      },
    ],
  }),
  component: LiveScoresPage,
});

type LiveScorePayload = { matches: LiveMatch[]; updatedAt: string };
type CompetitionFilter = "All" | Competition;

async function fetchLiveScores(force = false): Promise<LiveScorePayload> {
  const url = force ? `/api/live-scores?fresh=${Date.now()}` : "/api/live-scores";
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? "LIVE_SCORE_UNAVAILABLE");
  }
  return (await response.json()) as LiveScorePayload;
}

function LiveScoresPage() {
  const [filter, setFilter] = useState<CompetitionFilter>("All");
  const forceRefresh = useRef(false);
  const query = useQuery({
    queryKey: ["live-scores"],
    queryFn: () => {
      const force = forceRefresh.current;
      forceRefresh.current = false;
      return fetchLiveScores(force);
    },
    staleTime: 90_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
  const matches = (query.data?.matches ?? []).filter(
    (match) => filter === "All" || match.competition === filter,
  );
  const hasLiveMatches = (query.data?.matches.length ?? 0) > 0;

  return (
    <main className="min-h-screen bg-background px-4 pb-12 pt-5 sm:px-8 sm:pt-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="text-2xl text-foreground text-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="PitchOracle AI home"
          >
            Pitch<span className="text-primary">Oracle</span>
            <span className="ml-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-primary">
              AI
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                forceRefresh.current = true;
                void query.refetch();
              }}
              disabled={query.isFetching}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              aria-label="Refresh live scores"
            >
              <RotateCw size={14} className={query.isFetching ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link
              to="/"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-foreground transition hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft size={14} /> Fixtures
            </Link>
          </div>
        </header>

        <section className="relative mt-8 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/50 px-5 py-7 sm:mt-12 sm:px-9 sm:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-24 size-80 rounded-full bg-emerald-400/10 blur-3xl"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-primary">
                <Radio size={13} className="text-rose-400" /> LIVE MATCH CENTRE
              </div>
              <h1 className="mt-3 text-3xl leading-tight text-foreground sm:text-5xl">
                Scores as they happen.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Live Premier League and Champions League scores, refreshed automatically while this
                page is open.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] text-muted-foreground">
              <span
                className={`size-2 rounded-full ${query.isError ? "bg-amber-300" : hasLiveMatches ? "bg-rose-400 motion-safe:animate-pulse" : "bg-emerald-300"}`}
                aria-hidden="true"
              />
              {query.isError
                ? "Feed unavailable"
                : `${hasLiveMatches ? "LIVE · " : "Feed online · "}Auto refresh · 2 min`}
            </div>
          </div>
        </section>

        <section className="mt-7" aria-labelledby="live-matches-heading">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] tracking-[0.22em] text-primary">MATCH CENTRE</p>
              <h2 id="live-matches-heading" className="mt-1 text-2xl text-foreground">
                Live matches
              </h2>
            </div>
            <div
              className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1"
              role="group"
              aria-label="Filter live matches by competition"
            >
              {(["All", "Premier League", "Champions League"] as CompetitionFilter[]).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={filter === item}
                    onClick={() => setFilter(item)}
                    className={`rounded-lg px-3 py-2 text-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4 sm:text-xs ${filter === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {item === "Champions League" ? (
                      <>
                        <span className="sm:hidden">UCL</span>
                        <span className="hidden sm:inline">{item}</span>
                      </>
                    ) : (
                      item
                    )}
                  </button>
                ),
              )}
            </div>
          </div>

          {query.isPending ? (
            <div className="glass-panel grid min-h-56 place-items-center rounded-2xl text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <LoaderCircle size={16} className="animate-spin" /> Loading live scores…
              </span>
            </div>
          ) : null}

          {query.isError ? <LiveError error={query.error} /> : null}

          {!query.isPending && !query.isError && matches.length === 0 ? (
            <div className="glass-panel rounded-2xl px-5 py-12 text-center sm:py-16">
              <Clock3 size={22} className="mx-auto text-primary" aria-hidden="true" />
              <h3 className="mt-4 text-lg text-foreground">
                {query.data?.matches.length
                  ? "No live matches in this competition"
                  : "No live matches right now"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                We’ll keep checking while this page is open. Browse the fixture list to see what’s
                coming up.
              </p>
              <Link
                to="/"
                className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 text-xs text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Upcoming fixtures <ArrowUpRight size={14} />
              </Link>
            </div>
          ) : null}

          {!query.isPending && !query.isError && matches.length > 0 ? (
            <div className="space-y-3">
              {matches.map((match) => (
                <LiveMatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : null}

          {query.data?.updatedAt ? (
            <p className="mt-4 text-right text-[10px] text-muted-foreground">
              Updated{" "}
              {new Date(query.data.updatedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          ) : null}
        </section>

        <p className="mt-8 text-center text-[10px] leading-relaxed text-muted-foreground/80">
          Live scores are provided by API-Football and may be delayed. Match status and score can
          change.
        </p>
      </div>
    </main>
  );
}

function LiveMatchCard({ match }: { match: LiveMatch }) {
  const status = statusLabel(match.status);
  return (
    <article
      className="glass-panel overflow-hidden rounded-2xl"
      aria-label={`${match.competition}: ${match.home.name} ${formatScore(match.home.goals)} ${formatScore(match.away.goals)} ${match.away.name}, ${status}`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate font-mono text-[9px] tracking-[0.17em] text-primary">
            {match.competition.toUpperCase()}
          </p>
          <p className="mt-1 truncate text-[10px] text-muted-foreground">
            {match.round}
            {match.venue ? ` · ${match.venue}` : ""}
          </p>
        </div>
        <div className="shrink-0 rounded-full border border-rose-300/20 bg-rose-400/10 px-2.5 py-1.5 text-center">
          <p className="font-mono text-[9px] font-semibold tracking-[0.1em] text-rose-200">
            {status}
          </p>
          {match.elapsed !== null ? (
            <p className="mt-0.5 font-mono text-[9px] text-rose-100/70">
              {match.elapsed}
              {match.addedTime ? `+${match.addedTime}` : "′"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-5 sm:gap-5 sm:px-8 sm:py-7">
        <LiveTeam name={match.home.name} crest={match.home.crest} align="right" />
        <div className="min-w-20 text-center sm:min-w-28">
          <p
            className="font-mono text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            aria-hidden="true"
          >
            {formatScore(match.home.goals)}
            <span className="px-2 text-primary">:</span>
            {formatScore(match.away.goals)}
          </p>
          <p className="mt-1 font-mono text-[8px] tracking-[0.15em] text-muted-foreground">
            LIVE SCORE
          </p>
        </div>
        <LiveTeam name={match.away.name} crest={match.away.crest} align="left" />
      </div>
    </article>
  );
}

function LiveTeam({
  name,
  crest,
  align,
}: {
  name: string;
  crest?: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-2 sm:gap-3 ${align === "right" ? "justify-end text-right" : "text-left"}`}
    >
      <span className="line-clamp-2 text-xs font-medium text-foreground sm:text-sm">{name}</span>
      {crest ? (
        <img
          src={crest}
          alt=""
          loading="lazy"
          className="size-8 shrink-0 object-contain sm:size-10"
        />
      ) : null}
    </div>
  );
}

function LiveError({ error }: { error: Error }) {
  const planLimited = error.message === "LIVE_SCORE_PLAN_LIMITED";
  const notConfigured = error.message === "LIVE_DATA_NOT_CONFIGURED";
  const message = planLimited
    ? "Your API-Football plan does not include live scores. Check its livescore coverage to enable this page."
    : notConfigured
      ? "Live scores need an API-Football key. Add API_FOOTBALL_KEY to the server environment to enable the feed."
      : "The live score feed couldn’t be reached. Refresh to try again.";

  return (
    <div
      role="alert"
      className="glass-panel rounded-2xl border-amber-200/15 px-5 py-10 text-center"
    >
      <p className="text-sm text-amber-100">Live scores are unavailable</p>
      <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    "1H": "FIRST HALF",
    HT: "HALF-TIME",
    "2H": "SECOND HALF",
    ET: "EXTRA TIME",
    BT: "BREAK",
    P: "PENALTIES",
    LIVE: "LIVE",
    INT: "INTERRUPTED",
  };
  return labels[status] ?? status.toUpperCase();
}

function formatScore(goals: number | null) {
  return goals === null ? "–" : String(goals);
}
