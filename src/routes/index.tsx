import { createFileRoute } from "@tanstack/react-router";
import { FixtureBoard } from "@/components/match/FixtureBoard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PitchOracle AI — Premier League & Champions League fixtures" },
      {
        name: "description",
        content:
          "Browse Premier League and Champions League fixtures, then explore probability-led match forecasts with an explainable 3D pitch view.",
      },
      { property: "og:title", content: "PitchOracle AI — football forecasts, explained" },
      {
        property: "og:description",
        content: "Upcoming English football fixtures and explainable statistical forecasts.",
      },
    ],
  }),
  component: FixtureBoard,
});
