"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Point d'entrée du stage, hors du chargement initial.
 *
 * Le serveur rend le stage complet, en ligne (live et repli statique, tout le texte ; c'est ce que lisent les
 * navigateurs sans JS). Côté client, ce HTML est gardé tel quel à l'hydratation (enveloppe en
 * dangerouslySetInnerHTML : React ne touche pas à son contenu), et le module du stage (anneau, carte, étapes,
 * scroll) est un chunk à part, demandé quand le navigateur est inactif ou quand le stage approche du viewport,
 * et jamais en reduced-motion, sur écran de moins de 360px de haut ou sur appareil modeste (repli statique).
 * Une fois chargé, il remplace le HTML serveur dans le même commit : même hauteur, même position de scroll,
 * pas de flash.
 *
 * Pas de Suspense ici : React 19 sort du flux les grosses frontières Suspense (segment caché révélé par script),
 * ce qui rendrait le stage invisible sans JS.
 */

type StageComponent = ComponentType;

/**
 * Rendu serveur synchrone. `process.env.NEXT_RUNTIME` vaut "nodejs" ou "edge" côté serveur et est remplacé par une
 * chaîne vide dans le bundle client : la branche et son require y sont supprimés à la compilation.
 */
const ServerStage: StageComponent | null = process.env.NEXT_RUNTIME
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- rendu serveur synchrone uniquement
    (require("./StageImpl") as typeof import("./StageImpl")).Stage
  : null;

export function Stage() {
  const [Live, setLive] = useState<StageComponent | null>(null);

  useEffect(() => {
    const root = document.getElementById("boucle");
    let done = false;
    let idle: number | undefined;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && load(), { rootMargin: "600px 0px" });
    // Le repli statique suffit (et c'est lui que le CSS affiche) : on ne charge pas le stage animé.
    const staticOnly = window.matchMedia("(prefers-reduced-motion: reduce), (max-height: 359px)");
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const lowEnd = (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) || nav.connection?.saveData === true;
    if (lowEnd) root?.setAttribute("data-stage-fallback", "");

    function stop() {
      io.disconnect();
      if (idle !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      idle = undefined;
    }
    function schedule() {
      if (done || lowEnd || staticOnly.matches) return;
      if (root) io.observe(root);
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(load, { timeout: 1500 });
      else setTimeout(load, 300); // annulé par le garde `done` / staticOnly dans load()
    }
    function load() {
      if (done || staticOnly.matches) return;
      done = true;
      stop();
      import("./StageImpl")
        .then((m) => {
          // Si le focus est dans le stage, on le reporte sur l'élément équivalent du stage animé.
          const active = document.activeElement;
          const href = active instanceof HTMLAnchorElement && root?.contains(active) ? active.getAttribute("href") : null;
          setLive(() => m.Stage);
          if (href)
            requestAnimationFrame(() => root?.querySelector<HTMLElement>(`.stage-live a[href="${CSS.escape(href)}"]`)?.focus({ preventScroll: true }));
        })
        // Chunk introuvable (réseau coupé) : le HTML serveur reste en place, lisible et navigable.
        .catch(() => {
          done = false;
        });
    }
    // Préférence modifiée pendant la visite : on (re)programme ou on annule le chargement.
    const onChange = () => (staticOnly.matches ? stop() : schedule());
    staticOnly.addEventListener("change", onChange);
    schedule();
    return () => {
      done = true;
      stop();
      staticOnly.removeEventListener("change", onChange);
    };
  }, []);

  if (Live) {
    return (
      <div className="contents" data-stage-loaded="">
        <Live />
      </div>
    );
  }
  if (ServerStage) {
    return (
      <div className="contents">
        <ServerStage />
      </div>
    );
  }
  // Hydratation : on garde le HTML serveur sans le recréer.
  return <div className="contents" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />;
}
