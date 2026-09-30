import * as THREE from "three";

/** Real pitch size in metres; 1 world unit = 1 m. */
export const PITCH = { length: 105, width: 68 } as const;
const PX_PER_M = 8;

/**
 * Draws mowing stripes and FIFA line markings into one canvas texture, so the
 * whole pitch surface is a single draw call.
 */
export function createPitchTexture(maxAnisotropy = 4): THREE.CanvasTexture {
  const margin = 6; // run-off around the lines
  const W = (PITCH.length + margin * 2) * PX_PER_M;
  const H = (PITCH.width + margin * 2) * PX_PER_M;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  // stripes
  const stripes = 18;
  const sw = W / stripes;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? "#1f6b34" : "#23773a";
    g.fillRect(i * sw, 0, sw + 1, H);
  }
  const m = (v: number) => v * PX_PER_M;
  const ox = m(margin);
  const oy = m(margin);
  const L = m(PITCH.length);
  const Wd = m(PITCH.width);
  g.strokeStyle = "rgba(245,250,245,0.92)";
  g.fillStyle = "rgba(245,250,245,0.92)";
  g.lineWidth = m(0.12);

  g.strokeRect(ox, oy, L, Wd);
  g.beginPath();
  g.moveTo(ox + L / 2, oy);
  g.lineTo(ox + L / 2, oy + Wd);
  g.stroke();
  g.beginPath();
  g.arc(ox + L / 2, oy + Wd / 2, m(9.15), 0, Math.PI * 2);
  g.stroke();
  const spot = (x: number, y: number) => {
    g.beginPath();
    g.arc(x, y, m(0.25), 0, Math.PI * 2);
    g.fill();
  };
  spot(ox + L / 2, oy + Wd / 2);

  for (const side of [0, 1] as const) {
    const x0 = side ? ox + L : ox;
    const dir = side ? -1 : 1;
    const box = (depth: number, width: number) =>
      g.strokeRect(dir > 0 ? x0 : x0 - m(depth), oy + Wd / 2 - m(width) / 2, m(depth), m(width));
    box(16.5, 40.32);
    box(5.5, 18.32);
    const px = x0 + dir * m(11);
    spot(px, oy + Wd / 2);
    // penalty arc (outside the box only)
    const a = Math.acos(5.5 / 9.15);
    g.beginPath();
    if (dir > 0) g.arc(px, oy + Wd / 2, m(9.15), -a, a);
    else g.arc(px, oy + Wd / 2, m(9.15), Math.PI - a, Math.PI + a);
    g.stroke();
    // corner arcs
    for (const cy of [oy, oy + Wd]) {
      g.beginPath();
      const start = dir > 0 ? (cy === oy ? 0 : -Math.PI / 2) : cy === oy ? Math.PI / 2 : Math.PI;
      g.arc(x0, cy, m(1), start, start + Math.PI / 2);
      g.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, maxAnisotropy);
  return tex;
}

export const PITCH_MARGIN = 6;
