import { CARD_H, CARD_W, GRAPH_VIEW, passPoint, type StageLayout } from "./layout";

/**
 * Pose de la carte persistante en fonction de `p` (scrub) et de `pass` (passage par la brèche, temps réel).
 * Jalons desktop du §3.4 ; sur mobile, la carte reste centrée et l'inclinaison est divisée par deux.
 */
export type Pose = { x: number; y: number; scale: number; rotateY: number; opacity: number; color: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (v: number, a: number, b: number) => clamp01((v - a) / (b - a));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Origine du graphe de l'étape 04 (bas gauche), où la vignette vient se poser par son coin haut droit. */
export function graphOrigin(l: StageLayout) {
  const f = l.graph.w / GRAPH_VIEW.w;
  return {
    x: l.graph.cx - l.graph.w / 2 + GRAPH_VIEW.x0 * f,
    y: l.graph.cy - l.graph.h / 2 + GRAPH_VIEW.y0 * f,
  };
}

/** Centre de la carte pendant les étapes 01 à 03. */
export function stepCenter(l: StageLayout, v: number) {
  // Sur mobile, la carte remonte pendant l'étape 01 pour laisser la place aux testeurs empilés dessous.
  if (l.desktop) return { x: l.rightCx, y: l.cy };
  // Étape 03 : elle descend un peu pour laisser les avatars au-dessus.
  const lift = -0.07 * l.vh * (seg(v, 0.29, 0.32) - seg(v, 0.47, 0.5)) + 0.05 * l.vh * (seg(v, 0.63, 0.66) - seg(v, 0.8, 0.83));
  return { x: l.rightCx, y: l.cy + lift };
}

export function cardPose(v: number, pass: number, shake: number, l: StageLayout): Pose {
  const pp = passPoint(l.pass, pass);
  const passed = clamp01(pass);

  // 0 à 0.185 : au centre de l'anneau, à 0.6 ; puis le passage (temps réel) l'amène à côté de la brèche, à 1.
  let x = l.ring.cx + pp.x;
  let y = l.ring.cy + pp.y;
  let scale = 0.6 + 0.4 * pass;
  let rotateY = 0;

  // 0.20 à 0.225 : au centre, entre les deux voix.
  const toVoices = inOut(seg(v, 0.2, 0.225));
  x = mix(x, 0, toVoices);
  y = mix(y, l.voicesY, toVoices);
  scale = mix(scale, l.voicesScale, toVoices);

  // 0.29 à 0.32 : glisse vers les colonnes 7 à 12.
  const toSteps = inOut(seg(v, 0.29, 0.32));
  const sc = stepCenter(l, v);
  x = mix(x, sc.x, toSteps);
  y = mix(y, sc.y, toSteps);
  scale = mix(scale, 1, toSteps);
  rotateY = mix(rotateY, -8, toSteps);

  // Étape 02 : zoom à 1.18 entre 0.48 et 0.52, inclinaison -4.
  const zoom = inOut(seg(v, 0.48, 0.52));
  scale = mix(scale, l.desktop ? 1.18 : 1.08, zoom);
  rotateY = mix(rotateY, -4, zoom);

  // Étape 03 : retour à 1, inclinaison -6.
  const settle = inOut(seg(v, 0.63, 0.66));
  scale = mix(scale, 1, settle);
  rotateY = mix(rotateY, -6, settle);

  // Étape 04 : repli en vignette à 0.4 sur l'origine du graphe (0.80 à 0.86).
  const fold = inOut(seg(v, 0.8, 0.86));
  const o = graphOrigin(l);
  const thumb = { x: o.x - (CARD_W * 0.4 * l.k) / 2, y: o.y + (CARD_H * 0.4 * l.k) / 2 };
  x = mix(x, thumb.x, fold);
  y = mix(y, thumb.y, fold);
  scale = mix(scale, 0.4, fold);
  rotateY = mix(rotateY, 0, fold);

  // Opacité globale : 1 à 0.55 pendant la boucle (chaque tour l'épuise), 1 après le passage.
  const tired = mix(1, 0.55, seg(v, 0, 0.16));
  const opacity = mix(tired, 1, passed);
  // Couche couleur : s'éteint entre 0 et 0.10, se rallume à la cassure.
  const color = Math.max(1 - seg(v, 0, 0.1), 0);

  return { x: x + shake, y, scale: scale * l.k, rotateY: l.desktop ? rotateY : rotateY / 2, opacity, color };
}
