"use client";

import { useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { spring } from "@/lib/motion-tokens";
import { Break } from "./Break";
import { StageProvider, useStageValues } from "./context";
import { Curves } from "./Curves";
import { useMedia, useStageLayout } from "./hooks";
import { Loop } from "./Loop";
import { SCENES, sceneIndexAt, sceneStart, type SceneId } from "./scenes";
import { SceneTextLive } from "./SceneText";
import { SkipStory, StageAnchors, StageNav } from "./StageNav";
import { StageTranscript } from "./StageTranscript";
import { StageStatic } from "./StageStatic";
import { Ratings, Testers } from "./Steps";
import { StoryCard } from "./StoryCard";

// One useScroll smoothed by one useSpring: every scene reads this `p`.

// Without JS, show the static fallback.
const NO_JS = "<style>.stage-live{display:none!important}.stage-static{display:block!important}</style>";

const noop = () => () => {};

// Mounted only when used, so its scroll listeners do not run for nothing.
function LiveStage({ hydrated }: { hydrated: boolean }) {
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

  const onJump = useCallback((id: SceneId) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    // Slightly past the range start so the smoothed `p` lands in the target scene.
    const start = sceneStart(id);
    window.scrollTo({ top: top + (start > 0 ? start + 0.004 : 0) * range, behavior: "smooth" });
  }, []);

  return (
    <section
      ref={ref}
      data-stage
      data-scene={SCENES[scene].id}
      aria-label="Boucle et histoire"
      className="stage-live relative h-[360vh] lg:h-[480vh]"
    >
      <StageAnchors />
      <div ref={frame} className="stage-frame sticky top-0 h-svh overflow-clip">
        {/* Mounted after hydration to keep one heading outline. */}
        <SkipStory />
        {hydrated && <StageTranscript />}
        <StageProvider value={ctx}>
          <div aria-hidden="true" className="absolute inset-0 [perspective:1200px]">
            {/* Arcs first, so ring labels sit above the stroke. */}
            <Break p={p} />
            <Loop p={p} />
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
  );
}

export function Stage() {
  // The server HTML has both versions; after hydration, unmount the unused one.
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const reduce = useReducedMotion() ?? false;
  const short = useMedia("(max-height: 359px)", false);
  // Fallback on low-end devices or with data saver.
  const [lowEnd, setLowEnd] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const weak =
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) || nav.connection?.saveData === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client only
    if (weak) setLowEnd(true);
  }, []);
  const fallback = reduce || short || lowEnd;

  return (
    <div id="boucle" className="stage-root" data-stage-fallback={lowEnd ? "" : undefined}>
      <noscript dangerouslySetInnerHTML={{ __html: NO_JS }} />
      {(!hydrated || !fallback) && <LiveStage hydrated={hydrated} />}
      {(!hydrated || fallback) && <StageStatic animated={lowEnd} />}
    </div>
  );
}
