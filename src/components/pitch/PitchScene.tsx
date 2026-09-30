import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMatchStore, type CameraFocus } from "@/store/useMatchStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { AttackHeatmap, AttackPressureAnimation } from "./PredictionLayers";
import { Stadium } from "./Stadium";

const VIEWS: Record<
  CameraFocus,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  overview: { pos: [0, 130, 82], target: [0, 0, 0] },
  home: { pos: [-42, 76, 124], target: [-30, 0, 0] },
  away: { pos: [42, 76, 124], target: [30, 0, 0] },
};

function CameraRig({ compact }: { compact: boolean }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const controls = useRef<OrbitControls | null>(null);
  const transition = useRef<{
    elapsed: number;
    fromPosition: THREE.Vector3;
    toPosition: THREE.Vector3;
    fromTarget: THREE.Vector3;
    toTarget: THREE.Vector3;
  } | null>(null);
  const focus = useMatchStore((s) => s.focus);
  const cameraResetRun = useMatchStore((s) => s.cameraResetRun);

  useEffect(() => {
    const instance = new OrbitControls(camera, gl.domElement);
    instance.enableDamping = true;
    instance.dampingFactor = 0.08;
    instance.enablePan = true;
    instance.minDistance = 95;
    instance.maxDistance = 340;
    instance.minPolarAngle = 0.15;
    instance.maxPolarAngle = 1.18;
    instance.target.set(0, 0, 0);
    instance.listenToKeyEvents(window);
    instance.update();
    controls.current = instance;
    return () => {
      instance.dispose();
      controls.current = null;
    };
  }, [camera, gl]);

  useEffect(() => {
    const instance = controls.current;
    if (!instance) return;
    const view = VIEWS[focus];
    const position: [number, number, number] = compact
      ? focus === "overview"
        ? [0, 92, 60]
        : [view.pos[0], 29, 44]
      : view.pos;
    const target = new THREE.Vector3(...view.target);
    const destination = new THREE.Vector3(...position);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      camera.position.copy(destination);
      instance.target.copy(target);
      instance.update();
      transition.current = null;
      return;
    }
    transition.current = {
      elapsed: 0,
      fromPosition: camera.position.clone(),
      toPosition: destination,
      fromTarget: instance.target.clone(),
      toTarget: target,
    };
  }, [camera, cameraResetRun, compact, focus]);

  useFrame((_, delta) => {
    const current = transition.current;
    const instance = controls.current;
    if (current && instance) {
      current.elapsed += delta;
      const raw = Math.min(current.elapsed / 0.9, 1);
      const eased = raw * raw * (3 - 2 * raw);
      camera.position.lerpVectors(current.fromPosition, current.toPosition, eased);
      instance.target.lerpVectors(current.fromTarget, current.toTarget, eased);
      if (raw === 1) transition.current = null;
    }
    instance?.update();
  });
  return null;
}

function ForecastLayers() {
  const { teams, homeId, awayId, prediction } = useMatchStore(
    useShallow((state) => ({
      teams: state.teams,
      homeId: state.homeId,
      awayId: state.awayId,
      prediction: state.prediction,
    })),
  );
  const home = teams.find((team) => team.id === homeId);
  const away = teams.find((team) => team.id === awayId);
  if (!home || !away || !prediction) return null;
  return (
    <group>
      <AttackHeatmap home={home} away={away} prediction={prediction} />
      <AttackPressureAnimation />
      <Html position={[32, 0.7, 23]} center distanceFactor={160} zIndexRange={[2, 2]}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border border-emerald-300/30 bg-slate-950/85 px-2.5 py-1.5 text-center shadow-lg backdrop-blur-sm">
          <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-emerald-200">
            HOME · {home.shortName}
          </p>
          <p className="mt-0.5 font-mono text-[8px] text-white/80">
            {prediction.expectedGoals.home.toFixed(2)} xG
          </p>
        </div>
      </Html>
      <Html position={[-32, 0.7, 23]} center distanceFactor={160} zIndexRange={[2, 2]}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border border-sky-300/30 bg-slate-950/85 px-2.5 py-1.5 text-center shadow-lg backdrop-blur-sm">
          <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-sky-200">
            AWAY · {away.shortName}
          </p>
          <p className="mt-0.5 font-mono text-[8px] text-white/80">
            {prediction.expectedGoals.away.toFixed(2)} xG
          </p>
        </div>
      </Html>
      <Html position={[0, 0.7, -31]} center distanceFactor={120} zIndexRange={[2, 2]}>
        <div className="pointer-events-none whitespace-nowrap rounded-md border border-white/15 bg-slate-950/85 px-3 py-1.5 text-center shadow-lg backdrop-blur-sm">
          <p className="font-mono text-[9px] font-semibold tracking-[0.12em] text-white">
            MODEL ATTACK PRESSURE
          </p>
          <p className="mt-0.5 font-mono text-[9px] tracking-[0.08em] text-white/70">
            ESTIMATED ZONES · NO PLAYER TRACKING
          </p>
        </div>
      </Html>
    </group>
  );
}

export default function PitchScene() {
  const quality = useMatchStore((s) => s.quality);
  const compact = useIsMobile();
  const shadows = quality !== "low" && !compact;
  const pixelRatio: [number, number] | number = compact
    ? 1
    : quality === "high"
      ? [1, 1.6]
      : quality === "medium"
        ? [1, 1.25]
        : 1;
  return (
    <Canvas
      shadows={shadows}
      dpr={pixelRatio}
      camera={{
        position: compact ? [0, 92, 60] : VIEWS.overview.pos,
        fov: 48,
        near: 0.5,
        far: 600,
      }}
      gl={{ antialias: quality !== "low" && !compact, powerPreference: "high-performance" }}
      role="img"
      aria-label="Interactive full-pitch forecast view. Green and blue zones show model-estimated attacking pressure for each club, based on illustrative team profiles and expected goals, not player tracking. Use Fit pitch, Home focus or Away focus to change the view."
      fallback={
        <div
          role="status"
          className="grid h-full place-items-center bg-slate-950 p-8 text-center text-sm text-muted-foreground"
        >
          3D graphics are not available in this browser. The fixture forecast remains available in
          the match panel.
        </div>
      }
    >
      <color attach="background" args={["#05070d"]} />
      <fog attach="fog" args={["#05070d", 180, 520]} />
      <hemisphereLight args={["#9fc7ff", "#0a1a10", 0.85]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[-40, 60, 30]} intensity={1} color="#cfe6ff" />
      <Stadium shadows={shadows} compact={compact} />
      <ForecastLayers />
      <CameraRig compact={compact} />
    </Canvas>
  );
}
