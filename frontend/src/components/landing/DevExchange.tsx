"use client";

import Link from "next/link";
import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { spring } from "@/lib/motion-tokens";
import { ArrowIcon, ChatIcon, CheckIcon, CopyIcon } from "./icons";
import { containerCls, h2Cls, Kicker, useReduce } from "./reveal";
import { CodeAvatar } from "./stage/avatars";

/**
 * Section « Entre devs » (§3.9) : le snippet d'usage et l'espace d'échange.
 * - Le snippet se tape à 12 ms par caractère (plafonné à 900 ms) : un cache de la couleur du terminal
 *   recule par pas d'un caractère (transform en steps), le texte reste dans le DOM. Puis `data-app` se surligne.
 * - Copier : l'icône passe à la coche (spring 500/25), le libellé devient « Copié » 1600 ms, annoncé en aria-live.
 * - Les fils arrivent comme dans un chat : trois points « en train d'écrire » 500 ms, puis le message, à 700 ms d'écart.
 * Reduced-motion et sans JS : snippet complet, fils affichés, la copie change seulement le texte.
 */

const fr = (t: string) => t.replace(/ (?=[?:!])/g, " ");

export const SNIPPET = '<script src="https://[nom].ci/usage.js" data-app="monapp" defer></script>';
const TYPE_MS = Math.min(900, SNIPPET.length * 12);

type Tok = { t: string; c: "tag" | "attr" | "str" | "app" };
const TOKENS: Tok[] = [
  { t: "<script", c: "tag" },
  { t: " src=", c: "attr" },
  { t: '"https://[nom].ci/usage.js"', c: "str" },
  { t: " data-app=", c: "app" },
  { t: '"monapp"', c: "str" },
  { t: " defer", c: "attr" },
  { t: "></script>", c: "tag" },
];
const TOK_CLS = { tag: "text-ink-muted", attr: "text-ink", str: "text-accent/80", app: "text-ink" } as const;

const THREADS = [
  { text: fr("Webhooks mobile money en local, vous faites comment ?"), tag: "#paiement", stack: "Flutter", replies: 12 },
  {
    text: fr("Mes 3 restauratrices ont toutes bloqué sur le même écran. Quelqu'un a déjà géré l'offline sur Next ?"),
    tag: "#ux",
    stack: "Next.js",
    replies: 7,
  },
  { text: fr("Next.js + Postgres sur un petit VPS, retours ?"), tag: "#infra", stack: "Laravel", replies: 9 },
] as const;

const SNAP = { type: "spring", ...spring.snap } as const;
const MESSAGE = { type: "spring", stiffness: 350, damping: 30 } as const;

type Phase = "idle" | "armed" | "typing" | "done";

function Snippet() {
  const reduce = useReduce();
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, { once: true, amount: 0.6 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (reduce) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- l'état « à taper » n'existe qu'avec JS, hors du viewport
    setPhase((p) => (p === "idle" ? (inView ? "done" : "armed") : p === "armed" && inView ? "typing" : p));
  }, [reduce, inView]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SNIPPET);
    } catch {
      // Repli (contexte non sécurisé, permission refusée) : sélection et copie classique.
      const area = document.createElement("textarea");
      area.value = SNIPPET;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
  };

  const highlight = phase === "done" || phase === "idle";

  return (
    <div ref={root} className="overflow-hidden rounded-[var(--radius-terminal)] border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line py-2 pl-4 pr-2">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
          <span className="size-2.5 rounded-full bg-line" />
        </span>
        <span className="font-mono text-[12px] text-ink-muted">index.html</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-11 min-w-[104px] items-center justify-center gap-2 rounded-pill px-4 text-[14px] font-semibold text-ink transition-colors duration-150 hover:bg-ink/[0.06]"
        >
          <span className="relative inline-flex size-[18px]" aria-hidden="true">
            <motion.span
              className="absolute inset-0"
              initial={false}
              animate={copied && !reduce ? { opacity: 0, scale: 0.6 } : { opacity: 1, scale: 1 }}
              transition={SNAP}
            >
              <CopyIcon size={18} />
            </motion.span>
            <motion.span
              className="absolute inset-0 text-accent"
              initial={false}
              animate={copied && !reduce ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
              transition={SNAP}
            >
              <CheckIcon size={18} strokeWidth={2} />
            </motion.span>
          </span>
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Copié" : ""}
      </p>
      {/* Seul défilement horizontal autorisé de la page (§3.9 mobile). */}
      <div className="overflow-x-auto px-5 py-6 md:px-6 md:py-8" tabIndex={0} role="region" aria-label="Snippet d'usage">
        <pre className="relative inline-block overflow-hidden align-top font-mono text-[13px] leading-[1.7] md:text-[14px]">
          <code data-snippet="">
            {TOKENS.map((tok) =>
              tok.c === "app" ? (
                <span key={tok.t} className="relative">
                  <motion.span
                    aria-hidden="true"
                    className="absolute inset-y-[-1px] left-[1ch] right-0 origin-left rounded-[3px] bg-accent/20"
                    initial={false}
                    animate={{ scaleX: highlight ? 1 : 0 }}
                    transition={{ duration: phase === "done" ? 0.3 : 0, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <span className={`relative ${TOK_CLS.app}`}>{tok.t}</span>
                </span>
              ) : (
                <span key={tok.t} className={TOK_CLS[tok.c]}>
                  {tok.t}
                </span>
              ),
            )}
          </code>
          {(phase === "armed" || phase === "typing") && (
            <span
              aria-hidden="true"
              data-armed=""
              className={`snippet-cover absolute inset-y-0 left-0 w-full bg-surface ${phase === "typing" ? "is-typing" : ""}`}
              style={{ ["--n" as string]: SNIPPET.length, ["--ms" as string]: `${TYPE_MS}ms` }}
              onAnimationEnd={() => setPhase("done")}
            >
              <span className="cert-cursor absolute left-0 top-[0.2em] h-[1.2em] w-[0.6em] bg-accent" />
            </span>
          )}
        </pre>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-ink-muted"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, delay: i * 0.12, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

function Threads() {
  const reduce = useReduce();
  const root = useRef<HTMLUListElement>(null);
  const inView = useInView(root, { once: true, amount: 0.4 });
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState<number>(THREADS.length);
  const [typing, setTyping] = useState<number | null>(null);

  useEffect(() => {
    if (reduce || inView) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- les fils masqués n'existent qu'avec JS, hors du viewport
    setArmed(true);
    setShown(0);
  }, [reduce, inView]);

  useEffect(() => {
    if (!armed || !inView) return;
    const timers: number[] = [];
    THREADS.forEach((_, i) => {
      timers.push(window.setTimeout(() => setTyping(i), i * 700));
      timers.push(
        window.setTimeout(() => {
          setTyping(null);
          setShown(i + 1);
        }, i * 700 + 500),
      );
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [armed, inView]);

  return (
    <ul ref={root} className="flex flex-col gap-3">
      {THREADS.map((th, i) => {
        const on = i < shown;
        return (
          <li key={th.tag} className="relative">
            {typing === i && (
              <span className="absolute left-5 top-5 inline-flex h-9 items-center rounded-pill border border-line bg-surface px-4">
                <TypingDots />
              </span>
            )}
            <motion.article
              data-reveal=""
              initial={false}
              animate={on ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={armed ? { ...MESSAGE, opacity: { duration: 0.2 } } : { duration: 0 }}
              className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5"
            >
              <CodeAvatar size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-pill border border-line px-2 py-0.5 font-mono text-[11px] leading-[1.4] text-ink-muted">{th.stack}</span>
                  <span className="font-mono text-[12px] text-accent">{th.tag}</span>
                </div>
                <p className="mt-2 text-[15px] leading-snug text-ink">{th.text}</p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-ink-muted">
                  <ChatIcon size={16} />
                  {th.replies} réponses
                </p>
              </div>
            </motion.article>
          </li>
        );
      })}
    </ul>
  );
}

export function DevExchange() {
  return (
    <section id="entre-devs" aria-labelledby="devs-title" className="relative py-[var(--section-y)]">
      <div className={containerCls}>
        <div className="max-w-[860px]">
          <Kicker>Et entre devs, on se parle</Kicker>
          <h2 id="devs-title" className={`${h2Cls} mt-4`}>
            Une ligne de code. Et tu sais qui revient.
          </h2>
          <p className="mt-6 max-w-[60ch] text-[length:var(--text-lead)] leading-[var(--leading-lead)] text-ink-muted">
            Colle le script&nbsp;: on mesure l&apos;usage réel à <abbr title="7 jours après le test">J7</abbr> et à{" "}
            <abbr title="30 jours après le test">J30</abbr>, sans données perso inutiles. Et quand tu bloques, la communauté est là.
          </p>
        </div>

        <div className="mt-12 grid gap-10 md:mt-16 lg:grid-cols-12 lg:gap-x-[var(--grid-gutter)]">
          <div className="min-w-0 lg:col-span-7">
            <Snippet />
            <Link
              href="/inscription?role=dev"
              prefetch={false}
              className="group mt-8 inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill border border-ink/70 px-7 text-[16px] font-semibold leading-none text-ink transition-colors duration-150 hover:border-ink hover:bg-ink/[0.07] active:scale-[0.97] md:w-auto"
            >
              Rejoindre les devs
              <ArrowIcon size={20} className="transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="lg:col-span-5">
            <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.12em] text-ink-muted">Aperçu de l&apos;espace devs</p>
            <Threads />
          </div>
        </div>
      </div>
    </section>
  );
}
