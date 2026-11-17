import { CARD_H, CARD_W, GRAPH_VIEW, passPoint, type StageLayout } from "./layout";

// On mobile the card stays centered with half the tilt.
export type Pose = { x: number; y: number; scale: number; rotateY: number; opacity: number; color: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Step 04 graph origin, where the thumbnail lands by its top right corner.
export function graphOrigin(l: StageLayout) {
  const f = l.graph.w / GRAPH_VIEW.w;
  return {
    x: l.graph.cx - l.graph.w / 2 + GRAPH_VIEW.x0 * f,
    y: l.graph.cy - l.graph.h / 2 + GRAPH_VIEW.y0 * f,
  };
}

export function stepCenter(l: StageLayout, v: number) {
  // Mobile: the card moves up during step 01 to make room for the testers below.
  if (l.desktop) return { x: l.rightCx, y: l.cy };
  // Step 03: down a little to leave room for the avatars.
  const lift =
    -0.11 * l.vh * (seg(v, 0.29, 0.32) - seg(v, 0.47, 0.5)) + 0.05 * l.vh * (seg(v, 0.63, 0.66) - seg(v, 0.8, 0.83));
  return { x: l.rightCx, y: l.cy + lift };
}

export function cardPose(v: number, pass: number, shake: number, l: StageLayout): Pose {
  const pp = passPoint(l.pass, pass);
  const passed = clamp01(pass);

  // 0 to 0.185: in the ring at 0.6, then the pass brings it next to the gap at 1.
  let x = l.ring.cx + pp.x;
  let y = l.ring.cy + pp.y;
  let scale = 0.6 + 0.4 * pass;
  let rotateY = 0;

  // 0.214 to 0.236: to the center, between the two voices.
  const toVoices = inOut(seg(v, 0.214, 0.236));
  x = mix(x, 0, toVoices);
  y = mix(y, l.voicesY, toVoices);
  scale = mix(scale, l.voicesScale, toVoices);

  // 0.29 to 0.32: slides to columns 7 to 12.
  const toSteps = inOut(seg(v, 0.29, 0.32));
  const sc = stepCenter(l, v);
  x = mix(x, sc.x, toSteps);
  y = mix(y, sc.y, toSteps);
  scale = mix(scale, 1, toSteps);
  rotateY = mix(rotateY, -8, toSteps);

  // Step 02: zoom in.
  const zoom = inOut(seg(v, 0.48, 0.52));
  scale = mix(scale, l.desktop ? 1.18 : 1.08, zoom);
  rotateY = mix(rotateY, -4, zoom);

  // Step 03: back to 1.
  const settle = inOut(seg(v, 0.63, 0.66));
  scale = mix(scale, 1, settle);
  rotateY = mix(rotateY, -6, settle);

  // Step 04: shrinks to a thumbnail on the graph origin.
  const fold = inOut(seg(v, 0.8, 0.86));
  const o = graphOrigin(l);
  const thumb = { x: o.x - (CARD_W * 0.4 * l.k) / 2, y: o.y + (CARD_H * 0.4 * l.k) / 2 };
  x = mix(x, thumb.x, fold);
  y = mix(y, thumb.y, fold);
  scale = mix(scale, 0.4, fold);
  rotateY = mix(rotateY, 0, fold);

  // Fades during the loop, back to 1 after the pass.
  const tired = mix(1, 0.55, seg(v, 0, 0.16));
  const opacity = mix(tired, 1, passed);
  // Color layer: off from 0 to 0.10, back on at the break.
  const color = Math.max(1 - seg(v, 0, 0.1), 0);

  return { x: x + shake, y, scale: scale * l.k, rotateY: l.desktop ? rotateY : rotateY / 2, opacity, color };
}
