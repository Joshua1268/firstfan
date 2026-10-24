"use client";

import { useInView, useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { spring } from "@/lib/motion-tokens";
import { Break } from "./Break";
import { StageProvider, useStageValues } from "./context";
import { Curves } from "./Curves";
import { useMedia, useStageLayout } from "./hooks";
import { Loop } from "./Loop";
import { SCENES, sceneIndexAt, sceneStart, type SceneId } from "./scenes";
import { SceneTextLive } from "./SceneText";
import { StageNav } from "./StageNav";
import { StageStatic } from "./StageStatic";
import { Ratings, Testers } from "./Steps";
import { StoryCard } from "./StoryCard";

/**
 * Stage « Boucle et histoire » (§3.4) : un conteneur de 480vh (360vh sous 1024px) et un cadre sticky.
 * Un seul useScroll, lissé par un seul useSpring ; toutes les scènes lisent ce `p`.
 * En reduced-motion (ou sans JS, ou sur appareil modeste), le repli statique prend la place (StageStatic).
 */

// Sans JS : le repli statique s'affiche et le stage sticky disparaît.
const NO_JS = "<style>.stage-live{display:none!important}.stage-static{display:block!important}</style>";

export function Stage() {
  const ref = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, spring.scroll);
  const desktop = useMedia("(min-width: 1024px)", true);
  const ctx = useStageValues(desktop, false, 0);
  useStageLayout(frame, ctx.layout);
  const inView = useInView(ref);

  const [scene, setScene] = useState(0);
  useMotionValueEvent(p, "change", (v) => {
    const i = sceneIndexAt(v);
    if (i !== scene) setScene(i);
  });

  // Repli : appareil modeste ou économie de données (la hauteur < 360px est gérée en CSS).
  const [lowEnd, setLowEnd] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const weak = (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) || nav.connection?.saveData === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capacité de l'appareil, connue seulement côté client
    if (weak) setLowEnd(true);
  }, []);

  const onJump = useCallback((id: SceneId) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    // Un poil après le début de la plage, pour que le `p` lissé tombe bien dans la scène visée.
    const start = sceneStart(id);
    window.scrollTo({ top: top + (start > 0 ? start + 0.004 : 0) * range, behavior: "smooth" });
  }, []);

  return (
    <div id="boucle" className="stage-root" data-stage-fallback={lowEnd ? "" : undefined}>
      <noscript dangerouslySetInnerHTML={{ __html: NO_JS }} />
      <section
        ref={ref}
        data-stage
        data-scene={SCENES[scene].id}
        aria-label="Boucle et histoire"
        className="stage-live relative h-[360vh] lg:h-[480vh]"
      >
        <div ref={frame} className="stage-frame sticky top-0 h-svh overflow-clip">
          <StageProvider value={ctx}>
            <div aria-hidden="true" className="absolute inset-0 [perspective:1200px]">
              <Loop p={p} />
              <Break p={p} />
              <Curves p={p} />
              <StoryCard p={p} active={inView} />
              <Testers p={p} />
              <Ratings p={p} />
            </div>
            <SceneTextLive id={SCENES[scene].id} p={p} />
            <StageNav p={p} onJump={onJump} />
          </StageProvider>
        </div>
      </section>
      <StageStatic animated={lowEnd} />
    </div>
  );
}
