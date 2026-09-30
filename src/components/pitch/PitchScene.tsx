import { Canvas } from "@react-three/fiber";
import { CameraControls, Environment, Lightformer } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { useMatchStore, type CameraFocus } from "@/store/useMatchStore";
import { Stadium } from "./Stadium";
import { PITCH } from "./pitchTexture";

const VIEWS: Record<CameraFocus, { pos: [number, number, number]; target: [number, number, number] }> = {
  overview: { pos: [0, 58, 78], target: [0, 0, 0] },
  home: { pos: [-PITCH.length / 2 + 32, 18, 30], target: [-PITCH.length / 2 + 8, 0, 0] },
  away: { pos: [PITCH.length / 2 - 32, 18, 30], target: [PITCH.length / 2 - 8, 0, 0] },
};

function CameraRig() {
  const ref = useRef<CameraControls>(null);
  const focus = useMatchStore((s) => s.focus);
  useEffect(() => {
    const v = VIEWS[focus];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.setLookAt(...v.pos, ...v.target, !reduce);
  }, [focus]);
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={20}
      maxDistance={160}
      minPolarAngle={0.15}
      maxPolarAngle={Math.PI / 2.15}
      smoothTime={0.6}
    />
  );
}

export default function PitchScene() {
  const quality = useMatchStore((s) => s.quality);
  const shadows = quality !== "low";
  return (
    <Canvas
      shadows={shadows}
      dpr={quality === "high" ? [1, 2] : 1}
      camera={{ position: VIEWS.overview.pos, fov: 42, near: 0.5, far: 600 }}
      gl={{ antialias: quality !== "low" }}
      aria-label="3D football pitch"
    >
      <color attach="background" args={["#05070d"]} />
      <fog attach="fog" args={["#05070d", 110, 260]} />
      <hemisphereLight args={["#9fc7ff", "#0a1a10", 0.6]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-40, 60, 30]} intensity={0.8} color="#cfe6ff" />
      <Environment resolution={64}>
        <Lightformer intensity={2} position={[0, 20, 0]} rotation-x={Math.PI / 2} scale={[60, 40, 1]} />
        <Lightformer intensity={1} color="#6fe" position={[-40, 5, 0]} rotation-y={Math.PI / 2} scale={[60, 4, 1]} />
      </Environment>
      <Stadium shadows={shadows} />
      <CameraRig />
    </Canvas>
  );
}
