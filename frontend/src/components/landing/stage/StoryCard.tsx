"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import { CardProofs } from "./CardProofs";
import { CardTest } from "./CardTest";
import { useStage } from "./context";
import { CARD } from "./copy";
import { CARD_H, CARD_W } from "./layout";
import { cardPose } from "./pose";

/**
 * La carte de l'app : UN seul motion.div, jamais démonté, qui traverse toute l'histoire (§3.4).
 * x, y, scale et rotateY suivent `p` par jalons ; le gris et la couleur sont deux couches en fondu (pas de filter).
 * Les preuves récoltées sont ses enfants.
 */

type Tone = "gray" | "color";

function CardFace({ tone }: { tone: Tone }) {
  const c = tone === "color";
  return (
    <div className={`absolute inset-0 flex flex-col ${c ? "bg-surface" : "bg-watermark"}`}>
      {/* Barre du navigateur */}
      <div className="flex h-[30px] flex-none items-center gap-1.5 border-b border-line px-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`size-2 rounded-full ${c ? "bg-ink/25" : "bg-ghost/60"}`} />
        ))}
        <span className={`ml-3 flex h-[18px] flex-1 items-center rounded-full px-3 font-mono text-[10px] ${c ? "bg-bg text-ink-muted" : "bg-bg/60 text-ghost"}`}>
          {CARD.url}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-[18px] pt-3">
        <div className="flex items-center justify-between">
          <span className={`font-display text-[15px] font-bold ${c ? "text-ink" : "text-ghost"}`}>{CARD.title}</span>
          <span className={`size-6 rounded-full ${c ? "bg-ink/15" : "bg-ghost/40"}`} />
        </div>
        <div className="mt-3 flex w-[228px] items-center justify-between font-mono text-[10px] uppercase tracking-[0.1em]">
          <span className={c ? "text-ink-muted" : "text-ghost"}>Clients</span>
          <span className={c ? "text-ink-muted" : "text-ghost"}>+ Ajouter</span>
        </div>
        <ul className="mt-1.5 w-[228px]">
          {CARD.clients.map((cl) => (
            <li key={cl.name} className={`flex h-[38px] items-center justify-between border-b text-[12px] ${c ? "border-line text-ink" : "border-ghost/30 text-ghost"}`}>
              <span className="flex items-center gap-2">
                <span className={`size-5 rounded-full ${c ? "bg-ink/10" : "bg-ghost/30"}`} />
                {cl.name}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] ${c ? "bg-bg text-ink-muted" : "bg-bg/50 text-ghost"}`}>{cl.status}</span>
            </li>
          ))}
        </ul>
        <span
          className={`mt-auto mb-4 inline-flex h-8 w-fit items-center rounded-full px-4 text-[12px] font-semibold ${c ? "bg-ink text-bg" : "bg-ghost/50 text-bg"}`}
        >
          {CARD.send}
        </span>
      </div>
    </div>
  );
}

function GhostScreens({ p }: { p: MotionValue<number> }) {
  const on = useTransform(p, [0.3, 0.33, 0.78, 0.81], [0, 1, 1, 0], { clamp: true });
  const near = useTransform(on, (v) => v * 0.35);
  const far = useTransform(on, (v) => v * 0.18);
  return (
    <>
      <motion.div
        className="absolute inset-0 rounded-card border border-line bg-surface"
        style={{ z: -80, opacity: far }}
      />
      <motion.div
        className="absolute inset-0 rounded-card border border-line bg-surface"
        style={{ z: -40, opacity: near }}
      />
    </>
  );
}

export function StoryCard({ p, active = true }: { p: MotionValue<number>; active?: boolean }) {
  const { layout, pass, colorOn, shake, desktop } = useStage();
  const pose = useTransform(() => cardPose(p.get(), pass.get(), shake.get(), layout.get()));
  const x = useTransform(pose, (v) => v.x);
  const y = useTransform(pose, (v) => v.y);
  const scale = useTransform(pose, (v) => v.scale);
  const rotateY = useTransform(pose, (v) => v.rotateY);
  const opacity = useTransform(pose, (v) => v.opacity);
  const color = useTransform(() => Math.max(pose.get().color, colorOn.get()));

  return (
    <motion.div
      data-story-card
      className="absolute left-1/2 top-1/2"
      style={{
        width: CARD_W,
        height: CARD_H,
        marginLeft: -CARD_W / 2,
        marginTop: -CARD_H / 2,
        x,
        y,
        scale,
        rotateY,
        opacity,
        transformStyle: "preserve-3d",
        willChange: active ? "transform" : "auto",
      }}
    >
      {desktop && <GhostScreens p={p} />}
      <CardProofs p={p} layer="behind" />
      <div className="absolute inset-0 overflow-hidden rounded-card shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(242,237,227,0.06)]">
        <CardFace tone="gray" />
        <motion.div className="absolute inset-0" style={{ opacity: color }}>
          <CardFace tone="color" />
        </motion.div>
        <CardTest p={p} />
        {/* Filet intérieur au-dessus des couches */}
        <div className="pointer-events-none absolute inset-0 rounded-card shadow-[inset_0_0_0_1px_rgba(242,237,227,0.06)]" />
      </div>
      <CardProofs p={p} layer="front" />
    </motion.div>
  );
}
