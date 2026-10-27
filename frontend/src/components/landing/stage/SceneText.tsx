"use client";

import { AnimatePresence, motion, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import { createContext, useContext } from "react";
import { dur, ease } from "@/lib/motion-tokens";
import { ArrowIcon } from "../icons";
import { useStepValue } from "./context";
import { BREAK, CHECKLIST, CURVES, FEEDBACK, LOOP, RATINGS, STAMPS, STEP1, STEP2, STEP3, STEP4, TESTERS, type Step } from "./copy";
import type { SceneId } from "./scenes";
import { TwoVoices } from "./TwoVoices";

/**
 * Bloc texte d'une scène (§3.4) : colonnes 1 à 5 sur desktop, bas de l'écran sur mobile.
 * Il ne change qu'une fois par plage ; rien ne bouge pendant qu'on le lit. Tout est du vrai texte :
 * les visuels sont aria-hidden, leur contenu est repris ici en texte pour les lecteurs d'écran.
 */

/**
 * Stage animé : le texte visible n'existe que pour la scène courante ; les lecteurs d'écran lisent à la place
 * la transcription complète (StageTranscript). Le texte visible est donc aria-hidden, sauf les liens (CTA).
 */
export const HideText = createContext(false);
/** `aria-hidden` à poser sur un élément de texte du stage animé. */
export function useTextHidden(): true | undefined {
  return useContext(HideText) || undefined;
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p aria-hidden={useTextHidden()} className="font-mono text-[length:var(--text-kicker)] uppercase leading-[var(--leading-kicker)] tracking-[var(--tracking-kicker)] text-ink-muted">
      {children}
    </p>
  );
}

const TITLE =
  "font-display text-[26px] font-extrabold leading-[1.02] tracking-[-0.01em] text-ink [font-variation-settings:'wdth'_75] text-balance md:text-[34px] lg:text-[clamp(34px,3.9vw,58px)] lg:leading-[0.95]";
/**
 * Titre de scène. Dans le stage animé, le texte visible est aria-hidden et doublé par la transcription : il est
 * alors rendu en paragraphe, pour que la page n'expose qu'un seul plan de titres (transcription ou repli statique).
 */
function SceneTitle({ children }: { children: React.ReactNode }) {
  const hidden = useTextHidden();
  if (hidden)
    return (
      <p aria-hidden className={TITLE}>
        {children}
      </p>
    );
  return <h2 className={TITLE}>{children}</h2>;
}

const LINE = "text-[15px] leading-[1.5] lg:text-[clamp(16px,1.25vw,19px)]";

/** Position du bloc texte : colonnes 1 à 5 (desktop), bas de l'écran (mobile). */
const LIVE_BOX = "absolute left-[var(--st-tl)] w-[var(--st-tw)] top-[57%] lg:top-[calc(50%+32px)] lg:-translate-y-1/2";
/** Repli statique : sur mobile, le texte passe dans le flux sous le visuel (le bloc s'allonge s'il le faut). */
export const STATIC_BOX =
  "relative ml-[var(--st-tl)] w-[var(--st-tw)] pt-[57svh] pb-24 lg:absolute lg:ml-0 lg:pt-0 lg:pb-0 lg:left-[var(--st-tl)] lg:top-[calc(50%+32px)] lg:-translate-y-1/2";
export const TextBox = createContext(LIVE_BOX);

function ProLine({ children }: { children: React.ReactNode }) {
  return (
    <p aria-hidden={useTextHidden()} className={`${LINE} text-ink-muted`}>
      <span className="mr-2 inline-block rounded-[6px] border border-line px-1.5 py-[3px] align-[2px] font-mono text-[10.5px] leading-none tracking-[0.12em] text-ink">
        TESTEUR
      </span>
      {children}
    </p>
  );
}

function StepText({ step, children }: { step: Step; children?: React.ReactNode }) {
  const hidden = useTextHidden();
  return (
    <div className={`${useContext(TextBox)} flex flex-col gap-3 lg:gap-5`}>
      <Kicker>{step.kicker}</Kicker>
      <SceneTitle>{step.title}</SceneTitle>
      <p aria-hidden={hidden} className={`${LINE} max-w-[46ch] text-ink`}>
        {step.dev}
      </p>
      <div className="max-w-[46ch]">
        <ProLine>{step.pro}</ProLine>
      </div>
      {children}
    </div>
  );
}

function LoopText() {
  const hidden = useTextHidden();
  return (
    <div className={`${useContext(TextBox)} flex flex-col gap-3 lg:gap-5`}>
      <Kicker>{LOOP.kicker}</Kicker>
      <SceneTitle>{LOOP.title}</SceneTitle>
      <p aria-hidden={hidden} className="max-w-[46ch] font-mono text-[12.5px] leading-[1.6] text-ink-muted lg:text-[14px]">{LOOP.voice}</p>
      <div className="sr-only" aria-hidden={hidden}>
        <ol>
          {LOOP.labels.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ol>
        <ul>
          {LOOP.tours.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <ul>
          {LOOP.bubbles.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BreakText({ p }: { p: MotionValue<number> }) {
  // Seuil 0.19 : le titre sort du masque (105 % vers 0, 640 ms, out-expo) ; 0.20 : la ligne monte.
  const title = useStepValue(p, 0.19, 105, 0, { duration: dur.slow / 1000, ease: ease.outExpo }, { duration: dur.fast / 1000 });
  const line = useStepValue(p, 0.2, 0, 1, { duration: dur.medium / 1000, ease: ease.outQuint }, { duration: dur.fast / 1000 });
  const titleY = useTransform(title, (v) => `${v}%`);
  const hidden = useTextHidden();
  const lineY = useTransform(line, [0, 1], [12, 0]);
  return (
    <div className={`${useContext(TextBox)} flex flex-col gap-4 lg:gap-6`}>
      <SceneTitle>
        <span className="block overflow-clip pb-[0.06em]">
          <motion.span className="block" style={{ y: titleY }}>
            {BREAK.title}
          </motion.span>
        </span>
      </SceneTitle>
      <motion.p aria-hidden={hidden} className={`${LINE} max-w-[40ch] text-ink`} style={{ y: lineY, opacity: line }}>
        {BREAK.line}
      </motion.p>
    </div>
  );
}

function Step4Ctas({ p }: { p: MotionValue<number> }) {
  // Stage animé sur mobile : le cadre fait 100svh et la barre CTA collée porte déjà les deux CTA ; ceux de la
  // scène tomberaient sous la barre. Ils restent dans le repli statique (texte dans le flux) et sur desktop.
  const live = useTextHidden();
  const rise = useStepValue(p, 0.97, 0, 1, { type: "spring", stiffness: 260, damping: 22 }, { duration: dur.fast / 1000 });
  const y = useTransform(rise, [0, 1], [16, 0]);
  const visibility = useTransform(rise, (v) => (v > 0.01 ? "visible" : "hidden"));
  return (
    <motion.div
      className={`mt-1 flex-wrap items-center gap-x-5 gap-y-3 ${live ? "hidden lg:flex" : "flex"}`}
      style={{ y, opacity: rise, visibility }}
    >
      <Link
        prefetch={false}
        href="/inscription?role=dev"
        className="inline-flex h-12 items-center rounded-full bg-accent px-6 text-[16px] font-semibold leading-none text-accent-ink transition-colors duration-150 hover:bg-accent-press"
      >
        {CURVES.ctaDev}
      </Link>
      <a href="#pro" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-ink underline-offset-4 hover:underline">
        {CURVES.ctaPro}
        <ArrowIcon size={18} />
      </a>
    </motion.div>
  );
}

export function SceneContent({ id, p }: { id: SceneId; p: MotionValue<number> }) {
  const hidden = useTextHidden();
  switch (id) {
    case "loop":
      return <LoopText />;
    case "break":
      return <BreakText p={p} />;
    case "voices":
      return <TwoVoices p={p} />;
    case "step1":
      return (
        <StepText step={STEP1}>
          <ul className="sr-only" aria-hidden={hidden}>
            {TESTERS.map((t) => (
              <li key={t.name}>{[t.name, t.job, t.rating, "tag" in t ? t.tag : null, "Métier vérifié"].filter(Boolean).join(" · ")}</li>
            ))}
          </ul>
        </StepText>
      );
    case "step2":
      return (
        <StepText step={STEP2}>
          <ul className="sr-only" aria-hidden={hidden}>
            {CHECKLIST.map((c, i) => (
              <li key={c}>
                {c}, capturé à {STAMPS[i]}
              </li>
            ))}
          </ul>
        </StepText>
      );
    case "step3":
      return (
        <StepText step={STEP3}>
          <ul className="sr-only" aria-hidden={hidden}>
            {FEEDBACK.map((f) => (
              <li key={f}>{f}</li>
            ))}
            <li>
              {RATINGS.toDev.from} vers {RATINGS.toDev.to} : {RATINGS.toDev.value}
            </li>
            <li>
              {RATINGS.toTester.from} vers {RATINGS.toTester.to} : {RATINGS.toTester.value}
            </li>
          </ul>
        </StepText>
      );
    case "step4":
      return (
        <StepText step={STEP4}>
          <p className="sr-only" aria-hidden={hidden}>
            {CURVES.ghost} : la courbe chute presque à zéro dès {CURVES.axis[1]}. {CURVES.green} : {CURVES.j7}, {CURVES.j30}.
          </p>
          <Step4Ctas p={p} />
        </StepText>
      );
  }
}

const ENTER = { duration: dur.base / 1000, ease: ease.outQuint };
const EXIT = { duration: dur.fast / 1000, ease: [0.4, 0, 1, 1] as const };

/** Texte du stage animé : AnimatePresence mode="wait" sur l'index de scène (sortie 180 ms, entrée 320 ms). */
export function SceneTextLive({ id, p }: { id: SceneId; p: MotionValue<number> }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={id}
        data-scene-text={id}
        className="pointer-events-none absolute inset-0 [&_a]:pointer-events-auto"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1, transition: ENTER }}
        exit={{ y: -16, opacity: 0, transition: EXIT }}
      >
        <HideText.Provider value={true}>
          <SceneContent id={id} p={p} />
        </HideText.Provider>
      </motion.div>
    </AnimatePresence>
  );
}

