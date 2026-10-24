"use client";

import { motion, useMotionValueEvent, type MotionValue } from "motion/react";
import { useState } from "react";
import { ChevronIcon } from "../icons";
import { useStage } from "./context";
import { NAV } from "./copy";
import { sceneIndexAt, type SceneId } from "./scenes";

/**
 * Navigation du stage (§3.4) : 5 crans (Boucle, 01 à 04) et le lien « Passer l'histoire » vers #pro.
 * Desktop : barre verticale à gauche ; mobile : 5 segments en haut. Pastille active en layoutId, spring 500/38.
 */

const DOT = { type: "spring", stiffness: 500, damping: 38 } as const;

/** Cran actif : la boucle, la cassure et les deux voix appartiennent au cran « Boucle ». */
function notchAt(p: number) {
  return Math.max(0, sceneIndexAt(p) - 2);
}

export function StageNav({ p, onJump }: { p: MotionValue<number>; onJump: (scene: SceneId) => void }) {
  const { desktop } = useStage();
  const [active, setActive] = useState(() => notchAt(p.get()));
  useMotionValueEvent(p, "change", (v) => {
    const n = notchAt(v);
    if (n !== active) setActive(n);
  });

  const skip = (
    <a
      href="#pro"
      className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[11px] leading-none text-ink-muted transition-colors duration-150 hover:text-ink lg:text-[12px]"
    >
      {NAV.skip}
      <ChevronIcon size={14} />
    </a>
  );

  if (!desktop) {
    return (
      <nav aria-label={NAV.label} className="absolute inset-x-[var(--st-tl)] top-[64px] z-10 flex items-center gap-3">
        <ol className="flex flex-1 items-center gap-1.5">
          {NAV.items.map((item, i) => (
            <li key={item.scene} className="flex-1">
              <button
                type="button"
                aria-label={i === 0 ? item.label : `Étape ${item.label}`}
                aria-current={active === i ? "step" : undefined}
                onClick={() => onJump(item.scene)}
                className="relative flex h-10 w-full items-center"
              >
                <span className="h-[3px] w-full rounded-full bg-line" />
                {active === i && (
                  <motion.span layoutId="stage-dot" transition={DOT} className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-accent" />
                )}
              </button>
            </li>
          ))}
        </ol>
        {skip}
      </nav>
    );
  }

  return (
    <>
      <nav aria-label={NAV.label} className="absolute left-[var(--st-nav)] top-[calc(50%+32px)] z-10 -translate-y-1/2">
        <ol className="flex flex-col gap-1">
          {NAV.items.map((item, i) => (
            <li key={item.scene}>
              <button
                type="button"
                aria-label={i === 0 ? item.label : `Étape ${item.label}`}
                aria-current={active === i ? "step" : undefined}
                onClick={() => onJump(item.scene)}
                className={`group flex h-8 items-center gap-2.5 font-mono text-[11px] leading-none transition-colors duration-150 ${active === i ? "text-ink" : "text-ink-muted hover:text-ink"}`}
              >
                <span className="relative grid h-6 w-2.5 place-items-center">
                  <span className="size-1.5 rounded-full bg-ghost transition-colors duration-150 group-hover:bg-ink-muted" />
                  {active === i && <motion.span layoutId="stage-dot" transition={DOT} className="absolute inset-0 rounded-full bg-accent" />}
                </span>
                <span aria-hidden="true">{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="absolute bottom-7 left-[var(--st-tl)] z-10">{skip}</div>
    </>
  );
}
