import { describe, expect, it } from "vitest";
import { CARD_W, computeLayout, passPoint, RING_PAD } from "./layout";

const SIZES = [
  [1024, 768],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
  [820, 1180],
  [375, 812],
] as const;

describe("stage layout", () => {
  for (const [vw, vh] of SIZES) {
    const l = computeLayout(vw, vh);
    it(`${vw}x${vh}: the card stays on screen after crossing the breach`, () => {
      const end = passPoint(l.pass, 1);
      const cx = vw / 2 + l.ring.cx + end.x;
      const half = (CARD_W * l.k) / 2;
      expect(cx - half).toBeGreaterThanOrEqual(0);
      expect(cx + half).toBeLessThanOrEqual(vw);
    });
    it(`${vw}x${vh}: the path reaches the breach halfway`, () => {
      expect(passPoint(l.pass, 0.5)).toEqual(l.pass.breach);
      expect(passPoint(l.pass, 0)).toEqual({ x: 0, y: 0 });
    });
    if (vw >= 1024) {
      it(`${vw}x${vh}: ring labels clear the text columns and the card fits columns 7 to 12`, () => {
        const ringLeft = vw / 2 + l.ring.cx - l.ring.r - 80;
        expect(ringLeft).toBeGreaterThanOrEqual(l.textLeft + l.textWidth);
        expect(CARD_W * l.k * 1.18).toBeLessThanOrEqual(l.rightW + 0.5);
        expect(l.navLeft).toBeGreaterThanOrEqual(16);
      });
      it(`${vw}x${vh}: after the break, the open ring sits whole between the text and the card`, () => {
        const half = l.ring.recessScale * (l.ring.r + RING_PAD);
        const cardLeft = vw / 2 + l.ring.cx + passPoint(l.pass, 1).x - (CARD_W * l.k) / 2;
        expect(vw / 2 + l.ring.drift - half).toBeGreaterThanOrEqual(l.textLeft + l.textWidth);
        expect(vw / 2 + l.ring.drift + half).toBeLessThanOrEqual(cardLeft);
        expect(l.ring.recessScale).toBeGreaterThanOrEqual(0.4);
      });
    }
  }
});
