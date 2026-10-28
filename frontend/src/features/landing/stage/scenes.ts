// Scene ranges of the stage progress `p`.
export type SceneId = "loop" | "break" | "voices" | "step1" | "step2" | "step3" | "step4";

export const SCENES: readonly { id: SceneId; start: number; end: number }[] = [
  { id: "loop", start: 0, end: 0.16 },
  { id: "break", start: 0.16, end: 0.22 },
  { id: "voices", start: 0.22, end: 0.32 },
  { id: "step1", start: 0.32, end: 0.48 },
  { id: "step2", start: 0.48, end: 0.64 },
  { id: "step3", start: 0.64, end: 0.8 },
  { id: "step4", start: 0.8, end: 1 },
];

export function sceneIndexAt(p: number): number {
  for (let i = SCENES.length - 1; i > 0; i--) if (p >= SCENES[i].start) return i;
  return 0;
}

export function sceneAt(p: number): SceneId {
  return SCENES[sceneIndexAt(p)].id;
}

export function sceneStart(id: SceneId): number {
  return SCENES.find((s) => s.id === id)!.start;
}
