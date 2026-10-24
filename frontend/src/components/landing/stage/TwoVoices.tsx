"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { useContext } from "react";
import { dur, ease } from "@/lib/motion-tokens";
import { CodeAvatar, JobAvatar } from "./avatars";
import { useStepValue } from "./context";
import { VOICES } from "./copy";
import { Kicker, STATIC_BOX, TextBox, useTextHidden } from "./SceneText";

/**
 * Scène C (§3.4) : deux voix de part et d'autre de la carte (colonnes 1 à 4 et 9 à 12), la chute centrée dessous.
 * Mobile : carte en haut, citations empilées, la voix du pro d'abord.
 */

const COLUMN = { type: "spring", stiffness: 200, damping: 28 } as const;

function Quote({ who, side, p }: { who: "dev" | "pro"; side: "left" | "right"; p: MotionValue<number> }) {
  const v = VOICES[who];
  const enter = useStepValue(p, 0.23, 0, 1, COLUMN, { duration: dur.fast / 1000 });
  const fade = useTransform(p, [0.29, 0.32], [1, 0], { clamp: true });
  const x = useTransform(enter, [0, 1], [side === "left" ? -40 : 40, 0]);
  const opacity = useTransform(() => enter.get() * fade.get());
  const position =
    side === "left"
      ? "lg:left-[var(--st-ql)] lg:w-[var(--st-qlw)]"
      : "lg:left-[var(--st-qr)] lg:w-[var(--st-qrw)]";
  return (
    <motion.figure
      aria-hidden={useTextHidden()}
      className={`${who === "pro" ? "order-1" : "order-2"} flex flex-col gap-3 lg:absolute lg:top-[calc(50%+var(--st-vy))] lg:-translate-y-1/2 ${position}`}
      style={{ x, opacity }}
    >
      <blockquote className="text-[17px] font-medium leading-[1.35] text-ink md:text-[18px] lg:text-[length:var(--text-quote)]">
        <span className="text-accent">«&nbsp;</span>
        {v.quote}
        <span className="text-accent">&nbsp;»</span>
      </blockquote>
      <figcaption className="flex items-center gap-2.5 text-[13px] leading-snug text-ink-muted lg:text-[14px]">
        {who === "dev" ? <CodeAvatar size={32} /> : <JobAvatar size={32} />}
        {v.sign}
      </figcaption>
    </motion.figure>
  );
}

export function TwoVoices({ p }: { p: MotionValue<number> }) {
  const isStatic = useContext(TextBox) === STATIC_BOX;
  const close = useStepValue(p, 0.25, 0, 1, { duration: 0.4, ease: ease.outQuint }, { duration: dur.fast / 1000 });
  const fade = useTransform(p, [0.29, 0.32], [1, 0], { clamp: true });
  const closeY = useTransform(close, [0, 1], [12, 0]);
  const closeOpacity = useTransform(() => close.get() * fade.get());
  return (
    <div
      className={`flex flex-col gap-5 ${
        isStatic ? "relative px-[var(--st-tl)] pb-24 pt-[calc(50svh+var(--st-vy)+var(--st-vh)+16px)]" : "absolute inset-x-[var(--st-tl)] top-[calc(50%+var(--st-vy)+var(--st-vh)+16px)]"
      } lg:static lg:p-0`}
    >
      <div className="order-0 lg:absolute lg:left-1/2 lg:top-[calc(50%+var(--st-vy)-var(--st-vh)-56px)] lg:-translate-x-1/2 lg:whitespace-nowrap">
        <Kicker>{VOICES.kicker}</Kicker>
      </div>
      <Quote who="dev" side="left" p={p} />
      <Quote who="pro" side="right" p={p} />
      <motion.p
        aria-hidden={useTextHidden()}
        className="order-3 text-[15px] font-medium leading-snug text-ink lg:absolute lg:left-1/2 lg:top-[calc(50%+var(--st-vy)+var(--st-vh)+32px)] lg:w-[min(560px,40vw)] lg:-translate-x-1/2 lg:text-center lg:text-[length:var(--text-lead)]"
        style={{ y: closeY, opacity: closeOpacity }}
      >
        {VOICES.close}
      </motion.p>
    </div>
  );
}
