/**
 * Géométrie du stage, calculée à partir de la taille du viewport sticky (§3.4, §5 grille).
 * Toutes les positions sont en px, relatives au centre du viewport du stage (x vers la droite, y vers le bas).
 * Pur et testé : aucune lecture du DOM ici.
 */

export const CARD_W = 440;
export const CARD_H = 300;
/** Trajectoire de la carte (§4), écrite pour un anneau de rayon 240 : on la met à l'échelle. */
export const RING_REF_R = 240;
export const BREACH = { x: 210, y: -150 } as const;
/** Angle de la brèche dans le repère de l'anneau (SVG, y vers le bas), en degrés. */
export const BREACH_DEG = (Math.atan2(BREACH.y, BREACH.x) * 180) / Math.PI;

export type Pt = { x: number; y: number };

export type StageLayout = {
  vw: number;
  vh: number;
  /** Disposition « desktop » (>= 1024px) : texte colonnes 1 à 5, visuel colonnes 7 à 12. */
  desktop: boolean;
  /** Bord gauche et largeur du bloc texte (px absolus). */
  textLeft: number;
  textWidth: number;
  /** Colonnes de citations de la scène C (absolu) : 1 à 4 et 9 à 12. */
  quoteLeft: { left: number; width: number };
  quoteRight: { left: number; width: number };
  /** Centre vertical de la zone visuelle. */
  cy: number;
  /** Centre et largeur des colonnes 7 à 12. */
  rightCx: number;
  rightW: number;
  /** Facteur d'ajustement de la carte (scale effectif = jalon x k). */
  k: number;
  /** Scale (avant k) de la carte en scène C, pour qu'elle tienne entre les deux citations. */
  voicesScale: number;
  voicesY: number;
  /** `drift` : abscisse où l'anneau recule en filigrane après la cassure, pour libérer la place de la carte. */
  ring: { cx: number; cy: number; r: number; drift: number };
  /** Passage par la brèche, relatif au centre de l'anneau : contrôles de la courbe et arrivée. */
  pass: { c1: Pt; c2: Pt; breach: Pt; c3: Pt; end: Pt };
  /** Graphe de l'étape 04 : centre, largeur, hauteur (viewBox 600x320 mis à l'échelle). */
  graph: { cx: number; cy: number; w: number; h: number };
  /** Abscisse (absolue) de la barre de navigation verticale. */
  navLeft: number;
};

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
    // `S` réfléchit c2 autour de la brèche ; le second contrôle suit l'arrivée comme dans la spec (320,-40 pour 360,40).
    c3: { x: end.x - 40 * s, y: end.y - 80 * s },
    end,
  };
}

function desktopLayout(vw: number, vh: number): StageLayout {
  const g = 24;
  const contentLeft = Math.max(48, (vw - 1320) / 2);
  // Place réservée à gauche pour la barre de navigation du stage.
  const left = Math.max(contentLeft, 100);
  const right = vw - contentLeft;
  const col = (right - left - 11 * g) / 12;
  const colX = (i: number) => left + (i - 1) * (col + g);
  const span = (a: number, b: number) => ({ left: colX(a), width: colX(b) + col - colX(a) });

  const text = span(1, 5);
  const rightSpan = span(7, 12);
  const rightCx = rightSpan.left + rightSpan.width / 2 - vw / 2;
  const cy = 32; // la nav fixe fait 64px : on centre dans ce qui reste
  const k = Math.min(1, rightSpan.width / (CARD_W * 1.18));

  // Anneau : entre le texte et le bord, labels compris (80px de débord de chaque côté).
  const zoneL = text.left + text.width + g + 80;
  const zoneR = vw - g - 80;
  const d = clamp(Math.min(480, zoneR - zoneL, vh - 64 - 220), 260, 480);
  const ringCx = (zoneL + zoneR) / 2 - vw / 2;
  const endMaxX = vw / 2 - g - (CARD_W * k) / 2 - ringCx;
  // Après la cassure, l'anneau (à 0.7) glisse entre le texte et la carte : il ne reste pas sous la carte.
  const cardLeft = vw - g - CARD_W * k;
  const drift = (text.left + text.width + cardLeft) / 2 - vw / 2;
  const ring = { cx: ringCx, cy: cy - 8, r: d / 2, drift };

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
    pass: passFor(ring.r, endMaxX),
    graph: { cx: rightCx, cy, w: gw, h: (gw * GRAPH_VIEW.h) / GRAPH_VIEW.w },
    navLeft: Math.max(16, left - 84),
  };
}

function mobileLayout(vw: number, vh: number): StageLayout {
  const m = vw < 768 ? 16 : 48;
  const width = vw - 2 * m;
  // Zone visuelle : sous la nav (64px) et la barre de segments ; le texte occupe le bas.
  const cy = -0.15 * vh;
  const cardW = Math.min(0.62 * vw, 400);
  const k = cardW / CARD_W;
  const r = clamp(Math.min(0.32 * vw, 210, (0.42 * vh) / 2), 110, 210);
  const ring = { cx: 0, cy: cy + 6, r, drift: 0 };
  const endMaxX = vw / 2 - m - cardW / 2;
  const voicesScale = (0.6 * vw) / cardW;
  const vTop = 64 + 44;
  const voicesY = vTop + (CARD_H * k * voicesScale) / 2 - vh / 2;
  // La vignette (scale 0.4) se pose à gauche de l'origine : on décale le graphe pour qu'elle reste à l'écran.
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

/** Point de la trajectoire de passage à l'avancement t (0 à 1, extrapolé au-delà de 1 pour l'overshoot). */
export function passPoint(l: StageLayout["pass"], t: number): Pt {
  const p0 = { x: 0, y: 0 };
  // Deux cubiques : M 0 0 C c1 c2 breach, puis S c3 end (son contrôle de départ est le reflet de c2).
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
    // Prolonge selon la tangente d'arrivée pour que le dépassement de l'easing reste visible.
    const over = t - 1;
    const tx = l.end.x - l.c3.x;
    const ty = l.end.y - l.c3.y;
    return { x: l.end.x + tx * over, y: l.end.y + ty * over };
  }
  return t < 0.5 ? cubic(p0, l.c1, l.c2, l.breach, t * 2) : cubic(l.breach, r1, l.c3, l.end, (t - 0.5) * 2);
}

export const DEFAULT_LAYOUT = computeLayout(1440, 900);
