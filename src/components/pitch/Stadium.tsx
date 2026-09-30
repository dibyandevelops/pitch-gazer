import { useMemo } from "react";
import * as THREE from "three";
import { PITCH, PITCH_MARGIN, createPitchTexture } from "./pitchTexture";

function Goal({ side }: { side: 1 | -1 }) {
  const x = (side * PITCH.length) / 2;
  const w = 7.32;
  const h = 2.44;
  const d = 2;
  const post = "#f4f7f5";
  return (
    <group position={[x, 0, 0]} rotation-y={side > 0 ? 0 : Math.PI}>
      {[-w / 2, w / 2].map((z) => (
        <mesh key={z} position={[0, h / 2, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, h, 12]} />
          <meshStandardMaterial color={post} metalness={0.3} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, h, 0]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.06, 0.06, w, 12]} />
        <meshStandardMaterial color={post} metalness={0.3} roughness={0.3} />
      </mesh>
      {/* net: back + roof + sides as wireframe planes */}
      <mesh position={[d, h / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[w, h, 24, 8]} />
        <meshBasicMaterial color="#dfe8e4" wireframe transparent opacity={0.35} />
      </mesh>
      <mesh position={[d / 2, h, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[d, w, 6, 24]} />
        <meshBasicMaterial color="#dfe8e4" wireframe transparent opacity={0.3} />
      </mesh>
      {[-w / 2, w / 2].map((z) => (
        <mesh key={z} position={[d / 2, h / 2, z]}>
          <planeGeometry args={[d, h, 6, 8]} />
          <meshBasicMaterial color="#dfe8e4" wireframe transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/** Tiered stands on all four sides, built from a few boxes each. */
function Stands() {
  const tiers = 4;
  const gap = PITCH_MARGIN + 3;
  const sides = [
    { pos: [0, 0, PITCH.width / 2 + gap], rot: 0, len: PITCH.length + 20 },
    { pos: [0, 0, -PITCH.width / 2 - gap], rot: Math.PI, len: PITCH.length + 20 },
    { pos: [PITCH.length / 2 + gap, 0, 0], rot: -Math.PI / 2, len: PITCH.width + 10 },
    { pos: [-PITCH.length / 2 - gap, 0, 0], rot: Math.PI / 2, len: PITCH.width + 10 },
  ] as const;
  return (
    <>
      {sides.map((s, i) => (
        <group key={i} position={s.pos as unknown as [number, number, number]} rotation-y={s.rot}>
          {Array.from({ length: tiers }).map((_, t) => (
            <mesh key={t} position={[0, 1 + t * 2.4, 2 + t * 3.2]} receiveShadow>
              <boxGeometry args={[s.len, 2 + t * 2.4, 3.2]} />
              <meshStandardMaterial color={t % 2 ? "#1a2233" : "#141b2a"} roughness={0.9} />
            </mesh>
          ))}
          {/* glowing advertising board */}
          <mesh position={[0, 0.5, -1.5]}>
            <boxGeometry args={[s.len - 12, 1, 0.2]} />
            <meshStandardMaterial color="#0b1220" emissive="#19e6a0" emissiveIntensity={0.9} />
          </mesh>
        </group>
      ))}
    </>
  );
}

function Floodlight({ x, z }: { x: number; z: number }) {
  const h = 32;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.35, 0.6, h, 8]} />
        <meshStandardMaterial color="#2a3346" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, h, 0]} rotation={[-0.5, Math.atan2(-x, -z), 0, "YXZ"]}>
        <boxGeometry args={[5, 3, 0.6]} />
        <meshStandardMaterial color="#e8fbff" emissive="#dff6ff" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Stadium({ shadows }: { shadows: boolean }) {
  const texture = useMemo(() => createPitchTexture(), []);
  const fx = PITCH.length / 2 + 14;
  const fz = PITCH.width / 2 + 14;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[PITCH.length + PITCH_MARGIN * 2, PITCH.width + PITCH_MARGIN * 2]} />
        <meshStandardMaterial map={texture} roughness={0.95} />
      </mesh>
      {/* surrounding concourse */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#070b14" roughness={1} />
      </mesh>
      <Goal side={1} />
      <Goal side={-1} />
      <Stands />
      {[
        [fx, fz],
        [-fx, fz],
        [fx, -fz],
        [-fx, -fz],
      ] as [number, number][]).map(([x, z]) => (
        <Floodlight key={`${x}${z}`} x={x} z={z} />
      ))}
      {[
        [fx, fz],
        [-fx, -fz],
      ] as [number, number][]).map(([x, z], i) => (
        <spotLight
          key={i}
          position={[x * 0.9, 30, z * 0.9]}
          angle={0.7}
          penumbra={0.6}
          intensity={2200}
          distance={140}
          color="#eef9ff"
          castShadow={shadows && i === 0}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
      ))}
    </group>
  );
}
