import type { Prediction, Team } from "@/types/football";
import { TeamCrest } from "./TeamPicker";
import type { ScorerProjection } from "@/services/apiFootballScorers.server";

export function PredictionPanel({
  prediction,
  home,
  away,
  scorers,
  scorerStatus,
}: {
  prediction: Prediction;
  home: Team;
  away: Team;
  scorers: ScorerProjection[];
  scorerStatus: "idle" | "loading" | "ready" | "not-configured" | "plan-limited" | "unavailable";
}) {
  const outcomes = [
    { label: "HOME", value: prediction.homeWin, color: "bg-emerald-300", team: home.name },
    { label: "DRAW", value: prediction.draw, color: "bg-slate-300", team: "Draw" },
    { label: "AWAY", value: prediction.awayWin, color: "bg-sky-300", team: away.name },
  ];
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const fairOdds = (value: number) => (value > 0 ? (1 / value).toFixed(2) : "—");

  return (
    <section
      aria-live="polite"
      aria-label="Match prediction"
      className="mt-5 border-t border-white/10 pt-5"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-[0.24em] text-primary">MODEL FORECAST</p>
        <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[9px] uppercase tracking-wider text-primary">
          {prediction.confidence} confidence · {prediction.confidenceScore}/100
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.035] p-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamCrest team={home} small />
          <span className="truncate text-[10px] text-muted-foreground">{home.shortName}</span>
        </div>
        <div className="px-3 text-center">
          <p className="font-mono text-2xl font-semibold tracking-tight text-foreground">
            {prediction.mostLikely.homeGoals}
            <span className="px-1 text-primary">:</span>
            {prediction.mostLikely.awayGoals}
          </p>
          <p className="font-mono text-[8px] tracking-[0.18em] text-muted-foreground">
            LIKELIEST SCORE
          </p>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[10px] text-muted-foreground">{away.shortName}</span>
          <TeamCrest team={away} small />
        </div>
      </div>

      <div
        className="mt-4 space-y-3"
        role="group"
        aria-label={`Win draw loss probabilities: ${percent(prediction.homeWin)} ${home.name}, ${percent(prediction.draw)} draw, ${percent(prediction.awayWin)} ${away.name}`}
      >
        {outcomes.map((outcome) => (
          <div key={outcome.label}>
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                {outcome.label}
                <span className="ml-2 text-foreground/80">{outcome.team}</span>
              </span>
              <span className="font-mono text-foreground">{percent(outcome.value)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className={`h-full rounded-full ${outcome.color} transition-[width] duration-700`}
                style={{ width: percent(outcome.value) }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric
          label="EXPECTED GOALS"
          value={`${prediction.expectedGoals.home.toFixed(2)} — ${prediction.expectedGoals.away.toFixed(2)}`}
        />
        <Metric label="BOTH TEAMS SCORE" value={percent(prediction.btts)} />
        <Metric label="OVER 2.5 GOALS" value={percent(prediction.over25)} />
        <Metric
          label="FAIR ODDS · INFO ONLY"
          value={`${fairOdds(prediction.fairOdds.home)} / ${fairOdds(prediction.fairOdds.draw)} / ${fairOdds(prediction.fairOdds.away)}`}
        />
      </div>

      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.035] p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[9px] tracking-[0.18em] text-primary">
              PLAYER SCORER ESTIMATES
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Chance of scoring at least once
            </p>
          </div>
          {scorerStatus === "loading" ? (
            <span className="text-[9px] text-muted-foreground">Loading live stats…</span>
          ) : null}
        </div>
        {scorers.length > 0 ? (
          <div className="mt-3 space-y-2">
            {scorers.map((player) => (
              <div
                key={`${player.teamName}-${player.playerId}`}
                className="flex items-center gap-2"
              >
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt=""
                    className="size-8 rounded-full bg-white/10 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="size-8 rounded-full bg-white/10" aria-hidden="true" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">{player.name}</p>
                  <p className="truncate text-[9px] text-muted-foreground">
                    {player.teamName} · {player.goals} goals / {player.appearances} apps
                  </p>
                </div>
                <span className="font-mono text-xs text-primary">
                  {percent(player.anytimeProbability)}
                </span>
              </div>
            ))}
          </div>
        ) : scorerStatus === "not-configured" ? (
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Connect API-Football in the server environment to show real player names and
            season-based estimates. No player data is fabricated.
          </p>
        ) : scorerStatus === "plan-limited" ? (
          <p className="mt-2 text-[10px] leading-relaxed text-amber-100/80">
            Your API-Football plan does not include player data for this competition and season.
            Upgrade season coverage to see current player estimates. We hide them rather than show
            outdated players.
          </p>
        ) : scorerStatus === "unavailable" ? (
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            Real player data is temporarily unavailable for this competition or season. Try again
            later.
          </p>
        ) : scorerStatus === "ready" ? (
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            The provider has no qualifying scorer stats for these teams yet.
          </p>
        ) : null}
        <p className="mt-2 text-[9px] leading-relaxed text-muted-foreground/80">
          Estimates use current season scoring rates scaled to the team goal forecast. They are
          uncertain and do not confirm who will start.
        </p>
      </div>

      <div className="mt-4">
        <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">
          TOP SCORELINES
        </p>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {prediction.topScorelines.map((score) => (
            <div
              key={`${score.homeGoals}-${score.awayGoals}`}
              className="rounded-lg border border-white/8 bg-white/[0.035] px-1 py-2 text-center"
            >
              <p className="font-mono text-xs text-foreground">
                {score.homeGoals}–{score.awayGoals}
              </p>
              <p className="mt-1 font-mono text-[9px] text-muted-foreground">
                {percent(score.probability)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border-l-2 border-primary/70 bg-primary/[0.06] px-3 py-2.5">
        <p className="font-mono text-[9px] tracking-[0.18em] text-primary">WHY THIS FORECAST</p>
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
          {prediction.rationale[0] ??
            "The model weighs chance creation, defensive strength, form and home advantage."}
        </p>
      </div>
      <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground/80">
        Probabilistic model estimates only. Fair odds are model-implied values for information; this
        is not betting advice.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.035] p-2.5">
      <p className="font-mono text-[8px] tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}
