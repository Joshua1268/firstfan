// Pixels from the sticky viewport center. No DOM reads.

export const CARD_W = 440;
export const CARD_H = 300;
// The card path is written for a 240px ring and scaled.
export const RING_REF_R = 240;
export const BREACH = { x: 210, y: -150 } as const;
// Gap angle in degrees, SVG coordinates (y down).
export const BREACH_DEG = (Math.atan2(BREACH.y, BREACH.x) * 180) / Math.PI;

export type Pt = { x: number; y: number };

export type StageLayout = {
  vw: number;
  vh: number;
  // From 1024px: text in columns 1 to 5, visual in 7 to 12.
  desktop: boolean;
  textLeft: number;
  textWidth: number;
  // Scene C quote columns: 1 to 4 and 9 to 12.
  quoteLeft: { left: number; width: number };
  quoteRight: { left: number; width: number };
  cy: number;
  rightCx: number;
  rightW: number;
  // Card fit factor: actual scale is milestone scale times k.
  k: number;
  // Card scale in scene C, to fit between the quotes.
  voicesScale: number;
  voicesY: number;
  // After the break the ring drifts and shrinks, staying whole.
  ring: { cx: number; cy: number; r: number; drift: number; driftY: number; recessScale: number };
  // Pass through the gap, relative to the ring center.
  pass: { c1: Pt; c2: Pt; breach: Pt; c3: Pt; end: Pt };
  // Step 04 graph (600x320 viewBox, scaled).
  graph: { cx: number; cy: number; w: number; h: number };
  navLeft: number;
};

// How far the moved-back ring overflows its stroke, in px at scale 1.
export const RING_PAD = 12;

export const GRAPH_VIEW = { w: 600, h: 320, x0: 60, y0: 270, j7: 260, j30: 580, top: 40 } as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function computeLayout(vw: number, vh: number): StageLayout {
  const desktop = vw >= 1024;
  if (desktop) return desktopLayout(vw, vh);
  return mobileLayout(vw, vh);
}

function passFor(r: number, endMaxX: number): StageLayout["pass"] {
  const s = r / RING_REF_R;
  const end = { x: Math.min(360 * s, Math.max(endMaxX, 40 * s)), y: 40 * s };
  return {
    c1: { x: 60 * s, y: -40 * s },
    c2: { x: 140 * s, y: -120 * s },
    breach: { x: BREACH.x * s, y: BREACH.y * s },
    // `S` mirrors c2 around the gap; c3 follows the end point.
    c3: { x: end.x - 40 * s, y: end.y - 80 * s },
    end,
  };
}

function desktopLayout(vw: number, vh: number): StageLayout {
  const g = 24;
  const contentLeft = Math.max(48, (vw - 1320) / 2);
  // Room on the left for the stage nav.
  const left = Math.max(contentLeft, 100);
  const right = vw - contentLeft;
  const col = (right - left - 11 * g) / 12;
  const colX = (i: number) => left + (i - 1) * (col + g);
  const span = (a: number, b: number) => ({ left: colX(a), width: colX(b) + col - colX(a) });

  const text = span(1, 5);
  const rightSpan = span(7, 12);
  const rightCx = rightSpan.left + rightSpan.width / 2 - vw / 2;
  const cy = 32; // center below the 64px fixed nav
  const k = Math.min(1, rightSpan.width / (CARD_W * 1.18));

  // Ring between the text and the edge, labels included (80px each side).
  const zoneL = text.left + text.width + g + 80;
  const zoneR = vw - g - 80;
  const d = clamp(Math.min(480, zoneR - zoneL, vh - 64 - 220), 260, 480);
  const ringCx = (zoneL + zoneR) / 2 - vw / 2;
  const endMaxX = vw / 2 - g - (CARD_W * k) / 2 - ringCx;
  const pass = passFor(d / 2, endMaxX);
  // After the break, the ring shrinks to fit between the text and the card.
  const cardLeft = vw / 2 + ringCx + pass.end.x - (CARD_W * k) / 2;
  const zoneA = text.left + text.width + 16;
  const zoneB = cardLeft - 16;
  const recessScale = clamp((zoneB - zoneA) / (2 * (d / 2 + RING_PAD)), 0.4, 0.7);
  const drift = (zoneA + zoneB) / 2 - vw / 2;
  const ring = { cx: ringCx, cy: cy - 8, r: d / 2, drift, driftY: 0, recessScale };

  const mid = span(5, 8);
  const voicesScale = Math.min(1, (mid.width + 2 * g) / (CARD_W * k));

  const gw = Math.min(600, rightSpan.width);
  return {
    vw,
    vh,
    desktop: true,
    textLeft: text.left,
    textWidth: text.width,
    quoteLeft: span(1, 4),
    quoteRight: span(9, 12),
    cy,
    rightCx,
    rightW: rightSpan.width,
    k,
    voicesScale,
    voicesY: cy - 40,
    ring,
    pass,
    graph: { cx: rightCx, cy, w: gw, h: (gw * GRAPH_VIEW.h) / GRAPH_VIEW.w },
    navLeft: Math.max(16, left - 84),
  };
}

function mobileLayout(vw: number, vh: number): StageLayout {
  const m = vw < 768 ? 16 : 48;
  const width = vw - 2 * m;
  // Visual zone below the nav and the segment bar; text takes the bottom.
  const cy = -0.15 * vh;
  const cardW = Math.min(0.62 * vw, 400);
  const k = cardW / CARD_W;
  const r = clamp(Math.min(0.32 * vw, 210, (0.42 * vh) / 2), 110, 210);
  // After the break, the ring moves up and left so the gap stays visible above the card.
  const ring = { cx: 0, cy: cy + 6, r, drift: -0.1 * vw, driftY: -0.07 * vh, recessScale: 0.7 };
  const endMaxX = vw / 2 - m - cardW / 2;
  const voicesScale = (0.6 * vw) / cardW;
  const vTop = 64 + 44;
  const voicesY = vTop + (CARD_H * k * voicesScale) / 2 - vh / 2;
  // The thumbnail lands left of the origin, so shift the graph to keep it on screen.
  const thumb = 0.4 * CARD_W * k;
  const gw = Math.min(width - thumb * 0.8, 520);
  return {
    vw,
    vh,
    desktop: false,
    textLeft: m,
    textWidth: width,
    quoteLeft: { left: m, width },
    quoteRight: { left: m, width },
    cy,
    rightCx: 0,
    rightW: width,
    k,
    voicesScale: Math.min(voicesScale, 1.1),
    voicesY,
    ring,
    pass: passFor(r, endMaxX),
    graph: { cx: (thumb * 0.8) / 2, cy: cy + 10, w: gw, h: (gw * GRAPH_VIEW.h) / GRAPH_VIEW.w },
    navLeft: m,
  };
}

// Point on the pass path at t, extrapolated past 1 for the overshoot.
export function passPoint(l: StageLayout["pass"], t: number): Pt {
  const p0 = { x: 0, y: 0 };
  // Two cubics: M 0 0 C c1 c2 breach, then S c3 end.
  const r1 = { x: 2 * l.breach.x - l.c2.x, y: 2 * l.breach.y - l.c2.y };
  const cubic = (a: Pt, b: Pt, c: Pt, d: Pt, u: number): Pt => {
    const v = 1 - u;
    return {
      x: v * v * v * a.x + 3 * v * v * u * b.x + 3 * v * u * u * c.x + u * u * u * d.x,
      y: v * v * v * a.y + 3 * v * v * u * b.y + 3 * v * u * u * c.y + u * u * u * d.y,
    };
  };
  if (t <= 0) return p0;
  if (t >= 1) {
    // Extend along the end tangent so the easing overshoot stays visible.
    const over = t - 1;
    const tx = l.end.x - l.c3.x;
    const ty = l.end.y - l.c3.y;
    return { x: l.end.x + tx * over, y: l.end.y + ty * over };
  }
  return t < 0.5 ? cubic(p0, l.c1, l.c2, l.breach, t * 2) : cubic(l.breach, r1, l.c3, l.end, (t - 0.5) * 2);
}

export const DEFAULT_LAYOUT = computeLayout(1440, 900);
