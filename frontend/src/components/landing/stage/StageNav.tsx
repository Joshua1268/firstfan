"use client";

import { motion, useMotionValueEvent, type MotionValue } from "motion/react";
import { useState } from "react";
import { ChevronIcon } from "../icons";
import { useStage } from "./context";
import { NAV } from "./copy";
import { sceneIndexAt, sceneStart, type SceneId } from "./scenes";

/**
 * Navigation du stage (§3.4) : 5 crans (Boucle, 01 à 04) et le lien « Passer l'histoire » vers #pro.
 * Desktop : barre verticale à gauche ; mobile : 5 segments en haut. Pastille active en layoutId, spring 500/38.
 */

const DOT = { type: "spring", stiffness: 500, damping: 38 } as const;

/** Ancre d'un cran : une cible invisible posée dans le stage au début de sa plage (voir StageAnchors). */
export const anchorId = (scene: SceneId) => `histoire-${scene}`;

/**
 * Cibles des crans, dans la section du stage (480vh / 360vh) : chaque cible est à `start x (hauteur - 100vh)`, la
 * position de scroll où le stage montre la scène. Les crans sont donc de vrais liens d'ancre, qui marchent avant le
 * chargement du stage animé ; une fois chargé, le clic fait un scroll doux à la place.
 */
export function StageAnchors() {
  return (
    <>
      {NAV.items.map((item) => {
        const start = sceneStart(item.scene);
        return (
          <span
            key={item.scene}
            id={anchorId(item.scene)}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 h-px w-px"
            style={{ top: `calc(${start > 0 ? start + 0.004 : 0} * (100% - 100svh))` }}
          />
        );
      })}
    </>
  );
}

/** Cran actif : la boucle, la cassure et les deux voix appartiennent au cran « Boucle ». */
function notchAt(p: number) {
  return Math.max(0, sceneIndexAt(p) - 2);
}

export function StageNav({ p, onJump }: { p: MotionValue<number>; onJump?: (scene: SceneId) => void }) {
  const { desktop } = useStage();
  const [active, setActive] = useState(() => notchAt(p.get()));
  useMotionValueEvent(p, "change", (v) => {
    const n = notchAt(v);
    if (n !== active) setActive(n);
  });

  if (!desktop) {
    return (
      <nav
        aria-label={NAV.label}
        className="absolute left-[var(--st-tl)] right-[calc(var(--st-tl)+140px)] top-[64px] z-10 flex items-center"
      >
        <ol className="flex flex-1 items-center gap-1.5">
          {NAV.items.map((item, i) => (
            <li key={item.scene} className="flex-1">
              <a
                href={`#${anchorId(item.scene)}`}
                aria-label={i === 0 ? item.label : `Étape ${item.label}`}
                aria-current={active === i ? "step" : undefined}
                onClick={(e) => {
                  if (!onJump) return;
                  e.preventDefault();
                  onJump(item.scene);
                }}
                className="relative flex h-10 w-full items-center"
              >
                <span className="h-[3px] w-full rounded-full bg-line" />
                {active === i && (
                  <motion.span
                    layoutId="stage-dot"
                    transition={DOT}
                    className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-accent"
                  />
                )}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  return (
    <>
      <nav aria-label={NAV.label} className="absolute left-[var(--st-nav)] top-[calc(50%+32px)] z-10 -translate-y-1/2">
        <ol className="flex flex-col gap-1">
          {NAV.items.map((item, i) => (
            <li key={item.scene}>
              <a
                href={`#${anchorId(item.scene)}`}
                aria-label={i === 0 ? item.label : `Étape ${item.label}`}
                aria-current={active === i ? "step" : undefined}
                onClick={(e) => {
                  if (!onJump) return;
                  e.preventDefault();
                  onJump(item.scene);
                }}
                className={`group flex h-8 items-center gap-2.5 font-mono text-[11px] leading-none transition-colors duration-150 ${active === i ? "text-ink" : "text-ink-muted hover:text-ink"}`}
              >
                <span className="relative grid h-6 w-2.5 place-items-center">
                  <span className="size-1.5 rounded-full bg-ghost transition-colors duration-150 group-hover:bg-ink-muted" />
                  {active === i && (
                    <motion.span
                      layoutId="stage-dot"
                      transition={DOT}
                      className="absolute inset-0 rounded-full bg-accent"
                    />
                  )}
                </span>
                <span aria-hidden="true">{item.label}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

/** « Passer l'histoire » : en tête du stage dans l'ordre de tabulation ; en haut à droite sur mobile, en bas à gauche sur desktop. */
export function SkipStory() {
  return (
    <a
      href="#pro"
      className="absolute right-[var(--st-tl)] top-[64px] z-20 inline-flex h-10 items-center gap-1 whitespace-nowrap font-mono text-[11px] leading-none text-ink-muted transition-colors duration-150 hover:text-ink lg:bottom-7 lg:left-[var(--st-tl)] lg:right-auto lg:top-auto lg:text-[12px]"
    >
      {NAV.skip}
      <ChevronIcon size={14} />
    </a>
  );
}
