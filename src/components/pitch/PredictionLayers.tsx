import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FORECAST_COLORS } from "@/lib/forecast-visuals";
import type { Prediction, Team } from "@/types/football";
import { PITCH } from "./pitchTexture";
import { useMatchStore } from "@/store/useMatchStore";

function colorWithAlpha(hex: string, alpha: number) {
  const color = new THREE.Color(hex);
  return `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${alpha})`;
}

function createHeatmap(home: Team, away: Team, prediction: Prediction) {
  const canvas = document.createElement("canvas");
  canvas.width = 1260;
  canvas.height = 816;
  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);
  context.globalCompositeOperation = "lighter";
  const paint = (team: Team, direction: 1 | -1, expectedGoals: number, color: string) => {
    team.stats.attackZones.forEach((strength, index) => {
      const x = direction * (14 + (index % 2) * 18);
      const lanes = [-16, 0, 16];
      const z = lanes[index]! * direction;
      const px = ((x + PITCH.length / 2) / PITCH.length) * canvas.width;
      const py = ((z + PITCH.width / 2) / PITCH.width) * canvas.height;
      const radius = 160 + strength * 140;
      const alpha = Math.min(0.55, 0.22 + strength * 0.28 + expectedGoals * 0.025);
      const glow = context.createRadialGradient(px, py, 0, px, py, radius);
      glow.addColorStop(0, colorWithAlpha(color, alpha));
      glow.addColorStop(0.45, colorWithAlpha(color, alpha * 0.52));
      glow.addColorStop(1, colorWithAlpha(team.colors.primary, 0));
      context.fillStyle = glow;
      context.fillRect(px - radius, py - radius, radius * 2, radius * 2);
    });
  };
  paint(home, 1, prediction.expectedGoals.home, FORECAST_COLORS.home);
  paint(away, -1, prediction.expectedGoals.away, FORECAST_COLORS.away);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

export function AttackHeatmap({
  home,
  away,
  prediction,
}: {
  home: Team;
  away: Team;
  prediction: Prediction;
}) {
  const texture = useMemo(() => createHeatmap(home, away, prediction), [home, away, prediction]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation-x={-Math.PI / 2} position-y={0.045} renderOrder={2}>
      <planeGeometry args={[PITCH.length, PITCH.width]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.82}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function PressurePulse({
  position,
  color,
  elapsed,
  visible,
}: {
  position: [number, number, number];
  color: string;
  elapsed: React.MutableRefObject<number>;
  visible: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const progress = Math.min(elapsed.current / 2.4, 1);
    group.current.visible = visible && progress < 1;
    const scale = 0.7 + progress * 2.2;
    group.current.scale.set(scale, scale, scale);
    group.current.children.forEach((child, index) => {
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.72 * (1 - progress) - index * 0.12);
    });
  });
  return (
    <group ref={group} position={position} rotation-x={-Math.PI / 2}>
      {[0, 1, 2].map((index) => (
        <mesh key={index} position-z={index * 0.025}>
          <ringGeometry args={[1.8 + index * 0.55, 1.92 + index * 0.55, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.72} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

export function AttackPressureAnimation() {
  const run = useMatchStore((state) => state.pressureAnimationRun);
  const elapsed = useRef(3);
  useEffect(() => {
    if (run === 0) return;
    elapsed.current = 0;
  }, [run]);
  useFrame((_, delta) => {
    if (run > 0 && elapsed.current < 2.4) elapsed.current += delta;
  });
  return (
    <group>
      <PressurePulse
        position={[31, 0.1, 0]}
        color={FORECAST_COLORS.home}
        elapsed={elapsed}
        visible={run > 0}
      />
      <PressurePulse
        position={[-31, 0.1, 0]}
        color={FORECAST_COLORS.away}
        elapsed={elapsed}
        visible={run > 0}
      />
    </group>
  );
}
