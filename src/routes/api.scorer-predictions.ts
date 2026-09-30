import { createFileRoute } from "@tanstack/react-router";
import { TEAMS } from "@/data/teams";
import { getScorerProjections } from "@/services/apiFootballScorers.server";
import type { Competition } from "@/types/football";

const competitions: Competition[] = ["Premier League", "Champions League"];

export const Route = createFileRoute("/api/scorer-predictions")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const homeName = url.searchParams.get("home")?.trim() ?? "";
        const awayName = url.searchParams.get("away")?.trim() ?? "";
        const competition = url.searchParams.get("competition") as Competition | null;
        const homeExpectedGoals = Number(url.searchParams.get("homeXg"));
        const awayExpectedGoals = Number(url.searchParams.get("awayXg"));
        const homeIsEligible = TEAMS.some(
          (team) => team.name === homeName && team.competitions?.includes(competition!),
        );
        const awayIsEligible = TEAMS.some(
          (team) => team.name === awayName && team.competitions?.includes(competition!),
        );

        if (
          !homeName ||
          homeName.length > 80 ||
          !awayName ||
          awayName.length > 80 ||
          !competition ||
          !competitions.includes(competition) ||
          !homeIsEligible ||
          !awayIsEligible ||
          homeName === awayName ||
          !Number.isFinite(homeExpectedGoals) ||
          homeExpectedGoals < 0 ||
          homeExpectedGoals > 8 ||
          !Number.isFinite(awayExpectedGoals) ||
          awayExpectedGoals < 0 ||
          awayExpectedGoals > 8
        ) {
          return Response.json({ error: "Invalid match details." }, { status: 400 });
        }

        try {
          const players = await getScorerProjections({
            homeName,
            awayName,
            competition,
            homeExpectedGoals,
            awayExpectedGoals,
          });
          return Response.json(
            { players, season: Number(process.env.FOOTBALL_SEASON ?? new Date().getUTCFullYear()) },
            { headers: { "Cache-Control": "private, max-age=900" } },
          );
        } catch (error) {
          if (error instanceof Error && error.message === "SCORER_DATA_NOT_CONFIGURED") {
            return Response.json({ error: "SCORER_DATA_NOT_CONFIGURED" }, { status: 503 });
          }
          if (error instanceof Error && error.message.startsWith("SCORER_PROVIDER_API_plan:")) {
            console.error("Scorer provider plan does not cover requested competition or season.");
            return Response.json({ error: "SCORER_PLAN_LIMITED" }, { status: 402 });
          }
          console.error(
            "Scorer provider request failed:",
            error instanceof Error ? error.message : "UNKNOWN_ERROR",
          );
          return Response.json({ error: "SCORER_PROVIDER_UNAVAILABLE" }, { status: 502 });
        }
      },
    },
  },
});
