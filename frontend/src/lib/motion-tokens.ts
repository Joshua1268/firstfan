export const dur = {
  instant: 90,
  fast: 180,
  base: 320,
  medium: 420,
  slow: 640,
  story: 900,
  loopPulse: 1600,
  marquee: 40000,
} as const;

export const ease = {
  outExpo: [0.16, 1, 0.3, 1],
  outQuint: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  gravity: [0.55, 0, 1, 0.45],
  overshoot: [0.34, 1.3, 0.64, 1],
  arc: [0.33, 1, 0.68, 1],
} as const;

export const spring = {
  stamp: { stiffness: 650, damping: 22, mass: 0.8 },
  crack: { stiffness: 700, damping: 14 },
  snap: { stiffness: 500, damping: 25 },
  pop: { stiffness: 380, damping: 20 },
  settle: { stiffness: 260, damping: 24 },
  soft: { stiffness: 200, damping: 26 },
  lift: { stiffness: 180, damping: 24 },
  scroll: { stiffness: 200, damping: 40, restDelta: 0.0005 },
  pointer: { stiffness: 120, damping: 20 },
  magnet: { stiffness: 150, damping: 15 },
  odometer: { stiffness: 300, damping: 30 },
} as const;
