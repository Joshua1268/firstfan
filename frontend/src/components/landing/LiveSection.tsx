"use client";

import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PRODUCT_NAME } from "@/lib/brand";
import { ease, spring } from "@/lib/motion-tokens";
import type { PublicStats } from "@/lib/stats";
import { containerCls, kickerCls, riseVariants, usePageVisible, useReveal, useReduce } from "./reveal";

/**
 * Section « En direct » (§3.6).
 * - Valeurs initiales rendues côté serveur ; si l'API ne répond pas (`stats` null), la section garde son texte
 *   sans aucun compteur (jamais de chiffre inventé).
 * - Polling toutes les 15 s, en pause quand l'onglet est caché. La requête part du navigateur vers la même
 *   origine (`/api/public/stats`, route Next qui relit Django côté serveur) : aucun CORS à ouvrir côté Django.
 * - À l'entrée dans le viewport (une fois) : comptage de 0 à la valeur (MotionValue rendue par motion, sans re-render React).
 *   Ensuite, odomètre : seuls les chiffres qui changent roulent, et seulement sur un changement réel.
 * - Reduced-motion : valeurs finales, mises à jour en texte simple.
 */

const POLL_MS = 15_000;
const SUMMARY_EVERY_MS = 60_000;

type Counts = Pick<PublicStats, "tests_in_progress" | "verified_testers" | "apps_tested">;

const COUNTERS: { key: keyof Counts; one: string; many: string }[] = [
  { key: "tests_in_progress", one: "test en cours", many: "tests en cours" },
  { key: "verified_testers", one: "testeur vérifié", many: "testeurs vérifiés" },
  { key: "apps_tested", one: "app testée", many: "apps testées" },
];

const labelFor = (c: (typeof COUNTERS)[number], v: number) => (v > 1 ? c.many : c.one);

function summary(s: Counts) {
  return COUNTERS.map((c) => `${s[c.key]} ${labelFor(c, s[c.key])}`).join(", ") + ".";
}

/** Heure locale d'Abidjan (UTC), au format 14:32. */
function hhmm(d: Date) {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Abidjan" });
}

const ODOMETER = { type: "spring", ...spring.odometer } as const;

/** Une colonne de 0 à 9 par chiffre, en translateY. */
function Odometer({ value }: { value: number }) {
  const digits = String(value).split("");
  return (
    <span className="inline-flex">
      {digits.map((d, i) => (
        <span key={digits.length - i} className="inline-block h-[1em] overflow-hidden">
          <motion.span className="flex flex-col" initial={false} animate={{ y: `${-Number(d)}em` }} transition={ODOMETER}>
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
  // Valeur affichée en mode texte : une MotionValue que motion écrit seul dans le DOM (React ne gère pas ce nœud).
  const count = useMotionValue(value);
  const shown = useTransform(count, (v) => Math.round(v));
  const [odo, setOdo] = useState(false);
  const [changes, setChanges] = useState(0);
  const [seen, setSeen] = useState(value);
  // Changement réel : soulignement accent (scaleX 0 vers 1 puis opacité 1 vers 0, 600 ms). État dérivé au rendu.
  if (seen !== value) {
    setSeen(value);
    if (!reduce) setChanges((c) => c + 1);
  }

  // Comptage dès l'entrée dans le viewport, puis bascule en odomètre.
  useEffect(() => {
    if (!countUp || reduce || odo) return;
    const controls = animate(count, value, {
      duration: 1.2,
      ease: ease.outQuint as unknown as [number, number, number, number],
      delay: index * 0.12,
      onComplete: () => setOdo(true),
    });
    return () => controls.stop();
    // La valeur de départ est celle du serveur : on ne relance pas le comptage quand elle change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countUp, reduce]);

  // Mode texte (reduced-motion, ou avant l'odomètre) : la valeur suit les mises à jour du polling.
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

// TODO(plan-campagnes) : remplacer ces trois cartes statiques par le fil d'événements anonymisés (§3.6 :
// métier et commune, jamais de nom ni de montant ; entrée x -16 vers 0, `layout` spring 400/35, 3 éléments
// au maximum) quand les événements de campagne existeront.
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- heure de réception des valeurs du serveur, connue côté client
    setLastUpdate(new Date());
  }, []);

  // Polling (pas de SSE dans ce plan) : seulement si le serveur a pu lire l'API, et jamais onglet caché.
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
    // Repère pour les tests e2e : le polling est armé (après l'hydratation).
    const el = root.current;
    el?.setAttribute("data-live-polling", "");
    return () => {
      alive = false;
      window.clearInterval(id);
      el?.removeAttribute("data-live-polling");
    };
  }, [stats, visible]);

  // Résumé pour les lecteurs d'écran : au plus une fois par minute.
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
      setAnnounce(summary(data));
    }, wait);
    return () => window.clearTimeout(t);
  }, [data]);

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

        {data && (
          <div className="mt-10 grid grid-cols-2 gap-x-[var(--grid-gutter)] md:mt-14 md:grid-cols-3 md:gap-y-0 [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
            {COUNTERS.map((c, i) => (
              <Counter
                key={c.key}
                value={data[c.key]}
                label={labelFor(c, data[c.key])}
                index={i}
                countUp={inView}
                reduce={reduce}
              />
            ))}
          </div>
        )}

        <p className="mt-10 max-w-[46ch] text-[length:var(--text-lead)] leading-[var(--leading-lead)] text-ink md:mt-14">
          Chaque chiffre vient d&apos;un vrai test, pas d&apos;un formulaire.
        </p>
        {data?.demo && (
          <p className="mt-3 font-mono text-[12px] uppercase leading-snug tracking-[0.12em] text-ink-muted">
            Données de démo CADEV · mises à jour toutes les 15 s
          </p>
        )}
        {data && offline && lastUpdate && (
          <p className="mt-2 font-mono text-[12px] leading-snug text-ink-muted">
            Direct en pause. Dernière mise à jour à {hhmm(lastUpdate)}.
          </p>
        )}
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
