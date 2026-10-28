"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ComponentType, SVGProps } from "react";
import { spring } from "@/lib/motion-tokens";
import {
  ArrowIcon,
  ChatIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  PhoneIcon,
  ShieldIcon,
  SparkIcon,
  StarIcon,
} from "@/ui/icons";
import { PhoneDemo } from "@/features/landing/ProSection";
import { containerCls, h2Cls, Kicker, leadCls, riseVariants, useReveal } from "@/features/landing/reveal";
import { APPLY_HREF, APPLY_LABEL } from "./apply";

type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

const rise = riseVariants(20, spring.soft, 0.07);

function Head({ kicker, title, id, lead }: { kicker: string; title: string; id: string; lead?: string }) {
  const reveal = useReveal(0.5);
  return (
    <motion.div {...reveal}>
      <motion.div data-reveal="" variants={rise}>
        <Kicker>{kicker}</Kicker>
        <h2 id={id} className={`${h2Cls} mt-4 max-w-[18ch]`}>
          {title}
        </h2>
        {lead && <p className={`${leadCls} mt-6`}>{lead}</p>}
      </motion.div>
    </motion.div>
  );
}

/* ---------- Expertise ---------- */

const IMPACT: { icon: Icon; title: string; text: string }[] = [
  {
    icon: ChatIcon,
    title: "Tu lui évites de coder à côté",
    text: "Ton avis arrive avant qu'il passe des mois sur la mauvaise idée. Ce que tu dis franchement vaut plus qu'un compliment.",
  },
  {
    icon: SparkIcon,
    title: "Tu façonnes un outil pour ton travail",
    text: "L'app que tu testes est pensée pour ton métier. Si elle te sert au quotidien, tu l'adoptes, et tu as des avantages.",
  },
  {
    icon: StarIcon,
    title: "Ton profil prend de la valeur",
    text: "Chaque test validé et chaque note des devs s'ajoutent à ton profil vérifié. Les invitations suivent.",
  },
];

export function WhyYou() {
  const reveal = useReveal(0.25);
  return (
    <section id="ton-metier" aria-labelledby="ton-metier-title" className="py-[var(--section-y)]">
      <div className={containerCls}>
        <Head
          kicker="Ton expertise"
          id="ton-metier-title"
          title="Personne ne connaît ton travail mieux que toi."
          lead="Un dev peut coder une app de facturation en un week-end. Il ne sait pas ce qu'une comptable vérifie avant de clôturer le mois. Toi, tu le sais."
        />
        <motion.ul {...reveal} className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3 md:gap-[var(--grid-gutter)]">
          {IMPACT.map(({ icon: I, title, text }, i) => (
            <motion.li
              key={title}
              data-reveal=""
              custom={i}
              variants={rise}
              className="rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8"
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-line text-ink">
                <I size={22} />
              </span>
              <h3 className="mt-6 text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
                {title}
              </h3>
              <p className="mt-3 text-[16px] leading-[1.6] text-ink-muted">{text}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* ---------- Paid tests ---------- */

const STEPS = [
  {
    title: "Tu reçois une invitation",
    text: "Elle correspond à ton métier. Tu vois l'app et la durée estimée, puis tu acceptes ou tu refuses.",
  },
  {
    title: "Tu testes, guidé pas à pas",
    text: "Le parcours te dit quoi faire. Tes captures sont horodatées : ton travail est prouvé.",
  },
  {
    title: "Le dev valide ton test",
    text: "Il lit ton retour et le valide. C'est cette validation qui déclenche ton paiement.",
  },
  { title: "Tu es payé en mobile money", text: "Le paiement part sur ton compte Wave, Orange Money ou MTN MoMo." },
] as const;

export function Payment() {
  const reveal = useReveal(0.25);
  return (
    <section
      id="remuneration"
      aria-labelledby="remuneration-title"
      className="relative overflow-x-clip border-t border-line py-[var(--section-y)]"
    >
      <div className={`${containerCls} grid gap-y-14 lg:grid-cols-12 lg:gap-x-[var(--grid-gutter)]`}>
        <div className="lg:col-span-6">
          <Head
            kicker="Rémunération"
            id="remuneration-title"
            title="Chaque test est rémunéré."
            lead="Tu es payé pour le test complet, pas au bug trouvé. L'argent part une fois que le dev a validé ton travail."
          />
          {/* Real ordered steps, so numbering carries meaning. */}
          <motion.ol {...reveal} className="mt-12 flex flex-col">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                data-reveal=""
                custom={i}
                variants={rise}
                className="grid grid-cols-[44px_1fr] gap-x-4 border-t border-line py-5 last:border-b"
              >
                <span
                  className={`flex size-11 items-center justify-center rounded-full font-mono text-[13px] tabular-nums ${
                    i === STEPS.length - 1 ? "bg-accent text-accent-ink" : "border border-line text-ink"
                  }`}
                >
                  {i === STEPS.length - 1 ? <CheckIcon size={20} strokeWidth={2.25} /> : `0${i + 1}`}
                </span>
                <span className="pt-1">
                  <span className="block text-[18px] font-semibold leading-snug text-ink">{s.title}</span>
                  <span className="mt-1 block text-[16px] leading-[1.55] text-ink-muted">{s.text}</span>
                </span>
              </motion.li>
            ))}
          </motion.ol>
          <p className="mt-6 text-[14px] leading-snug text-ink-muted">
            Le montant de chaque test s&apos;affiche dans ton espace, avant que tu acceptes l&apos;invitation.
          </p>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7 lg:flex lg:items-center lg:justify-center">
          <PhoneDemo />
        </div>
      </div>
    </section>
  );
}

/* ---------- Flexibility ---------- */

const FLEX: { icon: Icon; title: string; text: string }[] = [
  { icon: PhoneIcon, title: "Depuis ton téléphone", text: "Rien à installer : tout se passe dans ton navigateur." },
  {
    icon: ClockIcon,
    title: "Entre deux clients",
    text: "Chaque invitation affiche sa durée estimée. Tu testes quand ça t'arrange.",
  },
  {
    icon: CheckIcon,
    title: "Tu choisis tes tests",
    text: "Tu acceptes ceux qui te parlent. Les autres, tu les refuses.",
  },
];

export function Flexibility() {
  const reveal = useReveal(0.3);
  return (
    <section
      id="a-ton-rythme"
      aria-labelledby="a-ton-rythme-title"
      className="border-t border-line py-[var(--section-y)]"
    >
      <div className={`${containerCls} grid gap-y-12 lg:grid-cols-12 lg:gap-x-[var(--grid-gutter)]`}>
        <div className="lg:col-span-5">
          <Head kicker="À ton rythme" id="a-ton-rythme-title" title="Depuis ton téléphone, quand tu veux." />
        </div>
        <motion.ul {...reveal} className="flex flex-col gap-8 lg:col-span-6 lg:col-start-7 lg:self-end">
          {FLEX.map(({ icon: I, title, text }, i) => (
            <motion.li key={title} data-reveal="" custom={i} variants={rise} className="flex items-start gap-4">
              <span className="flex size-11 flex-none items-center justify-center rounded-full border border-line text-ink">
                <I size={22} />
              </span>
              <span className="pt-1.5">
                <span className="block text-[18px] font-semibold leading-snug text-ink">{title}</span>
                <span className="mt-1 block text-[16px] leading-[1.55] text-ink-muted">{text}</span>
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* ---------- Trust ---------- */

const TRUST: { icon: Icon; title: string; text: string; link?: { href: string; label: string } }[] = [
  {
    icon: ShieldIcon,
    title: "Ton métier, vérifié une fois",
    text: "CV, LinkedIn ou justificatif : une personne de l'équipe vérifie, puis ton badge « Métier vérifié » parle pour toi.",
  },
  {
    icon: StarIcon,
    title: "Des notes dans les deux sens",
    text: "Le dev note ton test, et tu notes le dev. Ta voix compte autant que la sienne.",
  },
  {
    icon: LockIcon,
    title: "Confidentialité",
    text: "Tes documents de preuve ne sont jamais publics, et rien n'est revendu. Les apps que tu testes restent entre toi et le dev.",
    link: { href: "/confidentialite", label: "Lire la page confidentialité" },
  },
];

export function TrustBlock() {
  const reveal = useReveal(0.25);
  return (
    <section id="confiance" aria-labelledby="confiance-title" className="border-t border-line py-[var(--section-y)]">
      <div className={containerCls}>
        <Head kicker="Confiance" id="confiance-title" title="Du sérieux, dans les deux sens." />
        <motion.ul {...reveal} className="mt-14 grid gap-4 md:mt-20 md:grid-cols-3 md:gap-[var(--grid-gutter)]">
          {TRUST.map(({ icon: I, title, text, link }, i) => (
            <motion.li
              key={title}
              data-reveal=""
              custom={i}
              variants={rise}
              className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface/60 p-6 md:p-8"
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-line text-ink">
                <I size={22} />
              </span>
              <h3 className="mt-6 text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink">
                {title}
              </h3>
              <p className="mt-3 text-[16px] leading-[1.6] text-ink-muted">{text}</p>
              {link && (
                <Link
                  href={link.href}
                  prefetch={false}
                  className="mt-auto inline-flex min-h-11 items-center gap-1.5 pt-4 text-[15px] font-semibold text-ink underline-offset-4 hover:underline"
                >
                  {link.label}
                </Link>
              )}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/* ---------- Apply ---------- */

export function Apply() {
  const reveal = useReveal(0.4);
  return (
    <section
      id="cta-final"
      aria-labelledby="cta-final-title"
      className="relative overflow-hidden border-t border-line py-[var(--section-y)]"
    >
      <motion.div {...reveal} className={`${containerCls} flex flex-col items-center text-center`}>
        <motion.div data-reveal="" variants={rise} className="flex flex-col items-center">
          <Kicker>Candidature</Kicker>
          <h2
            id="cta-final-title"
            className="mt-5 max-w-[14ch] font-display text-[clamp(52px,12vw,140px)] font-extrabold uppercase leading-[var(--leading-h1)] tracking-[var(--tracking-h1)] text-ink [font-variation-settings:'wdth'_62] text-balance"
          >
            Ton métier compte.
          </h2>
          <p className={`${leadCls} mt-6 text-center`}>
            Propose ton profil. On vérifie ton métier, puis les invitations des devs arrivent sur ton téléphone.
          </p>
        </motion.div>
        <motion.div
          data-reveal=""
          custom={1}
          variants={rise}
          className="mt-10 flex w-full flex-col items-center gap-4 md:w-auto"
        >
          <Link
            href={APPLY_HREF}
            prefetch={false}
            data-apply-cta=""
            className="group inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-pill bg-accent px-7 text-[16px] font-semibold leading-none text-accent-ink transition-colors duration-150 hover:bg-accent-press active:bg-accent-press md:w-auto"
          >
            {APPLY_LABEL}
            <ArrowIcon size={20} className="transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
          <p className="text-[14px] leading-snug text-ink-muted">
            Tu es dev ?{" "}
            <Link href="/" prefetch={false} className="font-semibold text-ink underline-offset-4 hover:underline">
              Fais tester ton app
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
