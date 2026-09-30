import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PITCH, PITCH_MARGIN, createPitchTexture } from "./pitchTexture";

function Goal({ side }: { side: 1 | -1 }) {
  const x = (side * PITCH.length) / 2;
  const width = 7.32;
  const height = 2.44;
  const depth = 2;
  const post = "#f4f7f5";
  return (
    <group position={[x, 0, 0]} rotation-y={side > 0 ? 0 : Math.PI}>
      {[-width / 2, width / 2].map((z) => (
        <mesh key={z} position={[0, height / 2, z]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, height, 12]} />
          <meshStandardMaterial color={post} metalness={0.3} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]} rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.06, 0.06, width, 12]} />
        <meshStandardMaterial color={post} metalness={0.3} roughness={0.3} />
      </mesh>
      <mesh position={[depth, height / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[width, height, 24, 8]} />
        <meshBasicMaterial color="#dfe8e4" wireframe transparent opacity={0.35} />
      </mesh>
      <mesh position={[depth / 2, height, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[depth, width, 6, 24]} />
        <meshBasicMaterial color="#dfe8e4" wireframe transparent opacity={0.3} />
      </mesh>
      {[-width / 2, width / 2].map((z) => (
        <mesh key={z} position={[depth / 2, height / 2, z]}>
          <planeGeometry args={[depth, height, 6, 8]} />
          <meshBasicMaterial
            color="#dfe8e4"
            wireframe
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function CornerFlags() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.3);
  shape.lineTo(0.85, 0.06);
  shape.lineTo(0, -0.18);
  shape.closePath();
  return (
    <>
      {[-1, 1].flatMap((xSide) =>
        [-1, 1].map((zSide) => {
          const x = xSide * (PITCH.length / 2 - 0.2);
          const z = zSide * (PITCH.width / 2 - 0.2);
          return (
            <group key={`${xSide}-${zSide}`} position={[x, 0, z]}>
              <mesh position-y={1.15}>
                <cylinderGeometry args={[0.035, 0.045, 2.3, 8]} />
                <meshStandardMaterial color="#e5ece8" metalness={0.25} roughness={0.45} />
              </mesh>
              <mesh position={[0.32 * -xSide, 2.03, 0]} rotation-y={zSide < 0 ? Math.PI : 0}>
                <shapeGeometry args={[shape]} />
                <meshStandardMaterial
                  color={xSide === zSide ? "#54e89a" : "#67c9ff"}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          );
        }),
      )}
    </>
  );
}

/** A clean tactical pitch: markings and goals stay visible while stadium scenery stays out of the way. */
export function Stadium({ shadows, compact }: { shadows: boolean; compact: boolean }) {
  const maxAnisotropy = useThree((state) => state.gl.capabilities.getMaxAnisotropy());
  const texture = useMemo(() => createPitchTexture(maxAnisotropy), [maxAnisotropy]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow={shadows}>
        <planeGeometry args={[PITCH.length + PITCH_MARGIN * 2, PITCH.width + PITCH_MARGIN * 2]} />
        <meshStandardMaterial map={texture} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02}>
        <planeGeometry args={[240, 180]} />
        <meshStandardMaterial color="#08120f" roughness={1} />
      </mesh>
      <Goal side={1} />
      <Goal side={-1} />
      {!compact ? <CornerFlags /> : null}
    </group>
  );
}
