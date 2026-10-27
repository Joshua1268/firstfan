import {
  BREAK,
  CHECKLIST,
  CURVES,
  FEEDBACK,
  LOOP,
  RATINGS,
  STAMPS,
  STEP1,
  STEP2,
  STEP3,
  STEP4,
  TESTERS,
  VOICES,
  type Step,
} from "./copy";

/**
 * Transcription du stage pour les lecteurs d'écran (visuellement masquée).
 * Le stage animé n'affiche qu'une scène à la fois ; ici, les sept scènes se lisent dans l'ordre,
 * avec le contenu des visuels (labels de la boucle, testeurs, checklist, retours, notes, graphe).
 * Le texte visible du stage est aria-hidden pour ne pas être lu deux fois ; seuls ses liens restent exposés.
 */

function StepBlock({ step, children }: { step: Step; children: React.ReactNode }) {
  return (
    <>
      <p>{step.kicker}</p>
      <h2>{step.title}</h2>
      <p>{step.dev}</p>
      <p>Testeur : {step.pro}</p>
      {children}
    </>
  );
}

export function StageTranscript() {
  return (
    <div data-stage-transcript="" className="sr-only">
      <p>{LOOP.kicker}</p>
      <h2>{LOOP.title}</h2>
      <p>{LOOP.voice}</p>
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

      <h2>{BREAK.title}</h2>
      <p>{BREAK.line}</p>

      <p>{VOICES.kicker}</p>
      <figure>
        <blockquote>« {VOICES.dev.quote} »</blockquote>
        <figcaption>{VOICES.dev.sign}</figcaption>
      </figure>
      <figure>
        <blockquote>« {VOICES.pro.quote} »</blockquote>
        <figcaption>{VOICES.pro.sign}</figcaption>
      </figure>
      <p>{VOICES.close}</p>

      <StepBlock step={STEP1}>
        <ul>
          {TESTERS.map((t) => (
            <li key={t.name}>
              {[t.name, t.job, t.rating, "tag" in t ? t.tag : null, "Métier vérifié"].filter(Boolean).join(" · ")}
            </li>
          ))}
        </ul>
      </StepBlock>
      <StepBlock step={STEP2}>
        <ul>
          {CHECKLIST.map((c, i) => (
            <li key={c}>
              {c}, capturé à {STAMPS[i]}
            </li>
          ))}
        </ul>
      </StepBlock>
      <StepBlock step={STEP3}>
        <ul>
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
      </StepBlock>
      <StepBlock step={STEP4}>
        <p>
          {CURVES.ghost} : la courbe chute presque à zéro dès {CURVES.axis[1]}. {CURVES.green} : {CURVES.j7},{" "}
          {CURVES.j30}.
        </p>
      </StepBlock>
    </div>
  );
}
