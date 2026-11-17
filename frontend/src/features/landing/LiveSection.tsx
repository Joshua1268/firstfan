"use client";

import { motion, useInView, useMotionValue, useTransform } from "motion/react";
import { startCountUp } from "./count-up";
import { useEffect, useRef, useState } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { spring } from "@/lib/motion-tokens";
import { liveCounters, liveSummary } from "@/lib/live-counters";
import type { PublicStats } from "@/lib/stats";
import { containerCls, kickerCls, riseVariants, usePageVisible, useReveal, useReduce } from "./reveal";

// Polled every 15 s while visible.

const POLL_MS = 15_000;
const SUMMARY_EVERY_MS = 60_000;

const SPAN: Record<number, string> = { 1: "md:col-span-1", 2: "md:col-span-2" };

// The row stays full whatever the number of non-zero counters.
const GRID: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3 [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1",
};

function hhmm(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" });
}

const ODOMETER = { type: "spring", ...spring.odometer } as const;

// One 0-9 column per digit, moved with translateY.
function Odometer({ value }: { value: number }) {
  const digits = String(value).split("");
  return (
    <span data-odometer={value} className="inline-flex">
      {digits.map((d, i) => (
        <span key={digits.length - i} className="inline-block h-[1em] overflow-hidden">
          <motion.span
            className="flex flex-col"
            initial={false}
            animate={{ y: `${-Number(d)}em` }}
            transition={ODOMETER}
          >
            {"0123456789".split("").map((n) => (
              <span key={n} className="block h-[1em]">
                {n}
              </span>
            ))}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Counter({
  value,
  label,
  index,
  countUp,
  reduce,
}: {
  value: number;
  label: string;
  index: number;
  countUp: boolean;
  reduce: boolean;
}) {
  // Motion writes this value to the DOM itself, without a React render.
  const count = useMotionValue(value);
  const shown = useTransform(count, (v) => Math.round(v));
  const [odo, setOdo] = useState(false);
  const [changes, setChanges] = useState(0);
  const [seen, setSeen] = useState(value);
  // A real change flashes an accent underline.
  if (seen !== value) {
    setSeen(value);
    if (!reduce) setChanges((c) => c + 1);
  }

  useEffect(() => {
    if (!countUp || reduce || odo) return;
    const controls = startCountUp(count, value, { delay: index * 0.12, onComplete: () => setOdo(true) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- count up once
  }, [countUp, reduce]);

  // Text mode (reduced motion, or before the odometer) follows the polled value.
  useEffect(() => {
    if (reduce || !countUp) count.set(value);
  }, [value, reduce, countUp, count]);

  return (
    <div data-live-counter="" className="relative flex flex-col gap-3 border-line py-6 md:py-0">
      <p className="relative self-start font-mono text-[length:var(--text-counter)] font-medium leading-[var(--leading-counter)] tabular-nums text-ink">
        <span aria-hidden="true">
          {odo && !reduce ? <Odometer value={value} /> : <motion.span>{shown}</motion.span>}
        </span>
        <span className="sr-only">{value}</span>
        {changes > 0 && (
          <motion.span
            key={changes}
            aria-hidden="true"
            className="absolute inset-x-0 -bottom-2 h-[3px] origin-left rounded-full bg-accent"
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
            transition={{ duration: 0.6, times: [0, 0.5, 1], ease: "easeOut" }}
          />
        )}
      </p>
      <p className="text-[14px] leading-snug text-ink-muted">{label}</p>
    </div>
  );
}

// TODO: use the campaign event feed once it exists.
const STEPS = [
  { n: "01", title: "Une app est déposée", text: "Elle est horodatée dès le dépôt." },
  { n: "02", title: "Des pros vérifiés la testent", text: "Parcours guidé, preuves à l'appui." },
  { n: "03", title: "On regarde qui revient", text: "L'usage réel est mesuré à J7 et à J30." },
] as const;

export function LiveSection({ stats }: { stats: PublicStats | null }) {
  const reduce = useReduce();
  const visible = usePageVisible();
  const root = useRef<HTMLElement>(null);
  const inView = useInView(root, { amount: 0.4, once: true });
  const [data, setData] = useState(stats);
  const [offline, setOffline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [announce, setAnnounce] = useState("");
  const lastAnnounce = useRef(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client clock
    setLastUpdate(new Date());
  }, []);

  // Poll only if the server could read the API, and never in a hidden tab.
  useEffect(() => {
    if (!stats || !visible) return;
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch("/api/public/stats", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as PublicStats;
        if (!alive) return;
        setData((cur) =>
          cur &&
          cur.tests_in_progress === next.tests_in_progress &&
          cur.verified_testers === next.verified_testers &&
          cur.apps_tested === next.apps_tested &&
          cur.demo === next.demo
            ? cur
            : next,
        );
        setOffline(false);
        setLastUpdate(new Date());
      } catch {
        if (alive) setOffline(true);
      }
    };
    const id = window.setInterval(poll, POLL_MS);
    // Marker for e2e tests.
    const el = root.current;
    el?.setAttribute("data-live-polling", "");
    return () => {
      alive = false;
      window.clearInterval(id);
      el?.removeAttribute("data-live-polling");
    };
  }, [stats, visible]);

  // Screen reader summary, at most once a minute.
  useEffect(() => {
    if (!data) return;
    const now = Date.now();
    if (lastAnnounce.current === 0) {
      lastAnnounce.current = now;
      return;
    }
    const wait = Math.max(0, SUMMARY_EVERY_MS - (now - lastAnnounce.current));
    const t = window.setTimeout(() => {
      lastAnnounce.current = Date.now();
      setAnnounce(liveSummary(liveCounters(data)));
    }, wait);
    return () => window.clearTimeout(t);
  }, [data]);

  const counters = liveCounters(data);
  const inline = counters.length === 1 || counters.length === 2;
  const reveal = useReveal(0.3);
  const card = riseVariants(20, spring.soft, 0.09);

  return (
    <section
      ref={root}
      id="en-direct"
      aria-labelledby="en-direct-title"
      className="relative border-y border-line bg-bg-deep py-[var(--section-y)]"
    >
      <div className={containerCls}>
        <h2 id="en-direct-title" className={`${kickerCls} flex items-center gap-3 text-ink`}>
          <span aria-hidden="true" className="live-dot" />
          En ce moment sur {PRODUCT_NAME}
        </h2>

        {/* With 1 or 2 counters, the sentence fills the free columns of the row. */}
        <div className={inline ? "md:mt-14 md:grid md:grid-cols-3 md:items-end md:gap-x-[var(--grid-gutter)]" : ""}>
          {counters.length > 0 && (
            <div
              data-live-counters={counters.length}
              className={`mt-10 grid gap-x-[var(--grid-gutter)] md:gap-y-0 ${inline ? `md:mt-0 ${SPAN[counters.length]}` : "md:mt-14"} ${GRID[counters.length]}`}
            >
              {counters.map((c, i) => (
                <Counter key={c.key} value={c.value} label={c.label} index={i} countUp={inView} reduce={reduce} />
              ))}
            </div>
          )}

          <div className={inline ? `md:pb-1 ${SPAN[3 - counters.length]}` : ""}>
            <p
              className={`mt-10 max-w-[46ch] text-[length:var(--text-lead)] leading-[var(--leading-lead)] text-ink ${inline ? "md:mt-0" : "md:mt-14"}`}
            >
              Chaque chiffre vient d&apos;un vrai test, pas d&apos;un formulaire.
            </p>
            {data?.demo && (
              <p className="mt-3 font-mono text-[12px] uppercase leading-snug tracking-[0.12em] text-ink-muted">
                Données de démo · mises à jour toutes les 15 s
              </p>
            )}
            {data && offline && lastUpdate && (
              <p className="mt-2 font-mono text-[12px] leading-snug text-ink-muted">
                Direct en pause. Dernière mise à jour à {hhmm(lastUpdate)}.
              </p>
            )}
          </div>
        </div>
        <p aria-live="polite" className="sr-only">
          {announce}
        </p>

        <motion.ol {...reveal} className="mt-12 grid gap-3 md:mt-16 md:grid-cols-3 md:gap-[var(--grid-gutter)]">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              data-reveal=""
              custom={i}
              variants={card}
              className="flex items-start gap-4 rounded-[var(--radius-card)] border border-line bg-surface/60 p-5"
            >
              <span className="font-mono text-[13px] leading-[1.6] text-ink-muted">{s.n}</span>
              <span>
                <span className="block text-[16px] font-semibold leading-snug text-ink">{s.title}</span>
                <span className="mt-1 block text-[14px] leading-snug text-ink-muted">{s.text}</span>
              </span>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
