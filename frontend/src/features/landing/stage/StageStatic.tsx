"use client";

import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { ChevronIcon } from "@/ui/icons";
import { Break } from "./Break";
import { NAV } from "./copy";
import { StageProvider, useStageValues } from "./context";
import { Curves } from "./Curves";
import { useMedia, useStageLayout } from "./hooks";
import { Loop } from "./Loop";
import { SCENES, type SceneId } from "./scenes";
import { SceneContent, STATIC_BOX, TextBox } from "./SceneText";
import { Ratings, Testers } from "./Steps";
import { StoryCard } from "./StoryCard";

// On low-end devices each block replays its scene on enter.

type FrameDef = { id: SceneId; p: number; ring?: number; final?: boolean };

const FRAMES: FrameDef[] = [
  { id: "loop", p: 0.16, final: true },
  { id: "break", p: 0.2, ring: 0.22 },
  { id: "voices", p: 0.27 },
  { id: "step1", p: 0.41 },
  { id: "step2", p: 0.625 },
  { id: "step3", p: 0.775 },
  { id: "step4", p: 1 },
];

function Frame({ def, animated }: { def: FrameDef; animated: boolean }) {
  const reduce = useReducedMotion() ?? false;
  const play = animated && !reduce && !def.final;
  const start = SCENES.find((s) => s.id === def.id)!.start;
  const p = useMotionValue(def.p);
  const ringP = useMotionValue(def.ring ?? def.p);
  const desktop = useMedia("(min-width: 1024px)", true);
  const ctx = useStageValues(desktop, !play, def.p >= 0.185 ? 1 : 0);
  const root = useRef<HTMLElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  useStageLayout(visual, ctx.layout, root);
  const inView = useInView(root, { amount: 0.4, once: true });

  // Low-end device: replay the scene from its range start on enter.
  useEffect(() => {
    if (!play) return;
    if (!inView) {
      p.set(start);
      ringP.set(start);
      return;
    }
    const opts = { duration: 2.4, ease: "linear" as const };
    const a = animate(p, def.p, opts);
    const b = animate(ringP, def.ring ?? def.p, opts);
    return () => {
      a.stop();
      b.stop();
    };
  }, [play, inView, p, ringP, start, def.p, def.ring]);

  const ring = def.ring !== undefined ? ringP : p;
  const withRing = def.id === "loop" || def.id === "break" || def.id === "voices";

  return (
    <section ref={root} data-static-scene={def.id} className="relative overflow-clip lg:h-[max(640px,100svh)]">
      <StageProvider value={ctx}>
        <div
          ref={visual}
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[max(640px,100svh)] [perspective:1200px]"
        >
          {withRing && <Break p={ring} final={def.final} />}
          {withRing && <Loop p={ring} final={def.final} />}
          {def.id === "step4" && <Curves p={p} />}
          <StoryCard p={p} active={false} />
          {def.id === "step1" && <Testers p={p} />}
          {def.id === "step3" && <Ratings p={p} />}
        </div>
        <TextBox.Provider value={STATIC_BOX}>
          <SceneContent id={def.id} p={p} />
        </TextBox.Provider>
      </StageProvider>
    </section>
  );
}

export function StageStatic({ animated }: { animated: boolean }) {
  return (
    <div className="stage-static">
      <div className="px-[var(--grid-margin)] pt-6">
        <a
          href="#pro"
          className="inline-flex h-10 items-center gap-1 font-mono text-[12px] leading-none text-ink-muted transition-colors duration-150 hover:text-ink"
        >
          {NAV.skip}
          <ChevronIcon size={14} />
        </a>
      </div>
      {FRAMES.map((def) => (
        <Frame key={def.id} def={def} animated={animated} />
      ))}
    </div>
  );
}
