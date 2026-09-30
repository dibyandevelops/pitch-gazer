import { createFileRoute } from "@tanstack/react-router";
import { getLiveMatches } from "@/services/liveScores.server";

export const Route = createFileRoute("/api/live-scores")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const matches = await getLiveMatches();
          const forceRefresh = new URL(request.url).searchParams.has("fresh");
          return Response.json(
            { matches, updatedAt: new Date().toISOString() },
            {
              headers: {
                "Cache-Control": forceRefresh
                  ? "no-store"
                  : "public, max-age=0, s-maxage=90, stale-while-revalidate=120",
              },
            },
          );
        } catch (error) {
          if (error instanceof Error && error.message === "LIVE_DATA_NOT_CONFIGURED") {
            return Response.json({ error: "LIVE_DATA_NOT_CONFIGURED" }, { status: 503 });
          }
          if (error instanceof Error && error.message.startsWith("LIVE_PROVIDER_API_plan")) {
            return Response.json({ error: "LIVE_SCORE_PLAN_LIMITED" }, { status: 402 });
          }
          console.error(
            "Live score provider request failed:",
            error instanceof Error ? error.message : "UNKNOWN_ERROR",
          );
          return Response.json({ error: "LIVE_SCORE_UNAVAILABLE" }, { status: 502 });
        }
      },
    },
  },
});
