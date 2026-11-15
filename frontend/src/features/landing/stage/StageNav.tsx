"use client";

import { motion, useMotionValueEvent, type MotionValue } from "motion/react";
import { useState } from "react";
import { ChevronIcon } from "@/ui/icons";
import { useStage } from "./context";
import { NAV } from "./copy";
import { sceneIndexAt, sceneStart, type SceneId } from "./scenes";

// Five stops: vertical bar on desktop, segments on top on mobile.

const DOT = { type: "spring", stiffness: 500, damping: 38 } as const;

export const anchorId = (scene: SceneId) => `histoire-${scene}`;

// Real anchors, so stops work before the stage loads.
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

// The loop, the break and the two voices all belong to the first stop.
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

// First in tab order.
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
