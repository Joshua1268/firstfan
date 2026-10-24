"use client";

import { animate, useInView, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { Break } from "./Break";
import { StageProvider, useStageValues } from "./context";
import { Curves } from "./Curves";
import { useMedia, useStageLayout } from "./hooks";
import { Loop } from "./Loop";
import { SCENES, type SceneId } from "./scenes";
import { SceneContent, STATIC_BOX, TextBox } from "./SceneText";
import { Ratings, Testers } from "./Steps";
import { StoryCard } from "./StoryCard";

/**
 * Repli du stage (§3.4) : sept blocs empilés dans le flux, chacun figé dans l'état final de sa scène.
 * - reduced-motion, sans JS, écran de moins de 360px de haut : blocs statiques ;
 * - appareil modeste (moins de 4 cœurs, économie de données) : chaque bloc rejoue sa scène à l'entrée
 *   (whileInView, amount 0.4, une fois). La carte est dupliquée par bloc : seule exception à la carte unique.
 */

type FrameDef = { id: SceneId; p: number; ring?: number; final?: boolean };

const FRAMES: FrameDef[] = [
  // Anneau déjà ouvert, labels lisibles, bulles grises barrées.
  { id: "loop", p: 0.16, final: true },
  // Carte en couleur à côté de la brèche, anneau ouvert en filigrane, pas d'onde ni d'éclats.
  { id: "break", p: 0.2, ring: 0.22 },
  { id: "voices", p: 0.27 },
  // Testeurs tamponnés.
  { id: "step1", p: 0.41 },
  // Checklist cochée, polaroïds posés.
  { id: "step2", p: 0.625 },
  // Bulles et pastilles à leur place finale.
  { id: "step3", p: 0.775 },
  // Graphe complet, courbe grise barrée, autocollants posés.
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

  // Appareil modeste : la scène se rejoue depuis le début de sa plage quand le bloc entre dans le viewport.
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
        <div ref={visual} aria-hidden="true" className="absolute inset-x-0 top-0 h-[max(640px,100svh)] [perspective:1200px]">
          {withRing && <Loop p={ring} final={def.final} />}
          {withRing && <Break p={ring} final={def.final} />}
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
      {FRAMES.map((def) => (
        <Frame key={def.id} def={def} animated={animated} />
      ))}
    </div>
  );
}
