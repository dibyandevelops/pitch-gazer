import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { useMatchStore, type CameraFocus, type QualityLevel } from "@/store/useMatchStore";

const PitchScene = lazy(() => import("@/components/pitch/PitchScene"));

export const Route = createFileRoute("/match")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Match view — PitchOracle" },
      { name: "description", content: "Explore the floodlit 3D pitch where PitchOracle visualises each match forecast." },
      { property: "og:title", content: "Match view — PitchOracle" },
      { property: "og:description", content: "An interactive 3D stadium for football match predictions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MatchPage,
});

const FOCUS: { id: CameraFocus; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "home", label: "Home end" },
  { id: "away", label: "Away end" },
];
const QUALITY: QualityLevel[] = ["low", "medium", "high"];

function MatchPage() {
  const { focus, setFocus, quality, setQuality } = useMatchStore();
  return (
    <main className="fixed inset-0 bg-background">
      <Suspense fallback={<div className="grid h-full place-items-center text-muted-foreground">Loading stadium…</div>}>
        <PitchScene />
      </Suspense>

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4 sm:p-6">
        <Link to="/" className="pointer-events-auto text-2xl text-foreground text-glow">
          Pitch<span className="text-primary">Oracle</span>
        </Link>
        <div className="glass-panel pointer-events-auto flex gap-1 p-1 text-xs" role="group" aria-label="Render quality">
          {QUALITY.map((q) => (
            <button
              key={q}
              onClick={() => setQuality(q)}
              aria-pressed={quality === q}
              className={`rounded-md px-3 py-1.5 capitalize transition ${quality === q ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {q}
            </button>
          ))}
        </div>
      </header>

      <nav
        className="glass-panel absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1 p-1 text-sm"
        aria-label="Camera views"
      >
        {FOCUS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFocus(f.id)}
            aria-pressed={focus === f.id}
            className={`rounded-md px-4 py-2 transition ${focus === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {f.label}
          </button>
        ))}
      </nav>
      <p className="absolute bottom-20 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
        Drag to orbit · scroll to zoom · right-drag to pan
      </p>
    </main>
  );
}
