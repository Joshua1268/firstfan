"use client";

import { useEffect, useState, type ComponentType } from "react";

/**
 * Point d'entrée du stage, hors du chargement initial.
 *
 * Le serveur rend le stage complet, en ligne (live et repli statique, tout le texte ; c'est ce que lisent les
 * navigateurs sans JS). Côté client, ce HTML est gardé tel quel à l'hydratation (enveloppe en
 * dangerouslySetInnerHTML : React ne touche pas à son contenu), et le module du stage (anneau, carte, étapes,
 * scroll) est un chunk à part, demandé quand le navigateur est inactif ou quand le stage approche du viewport.
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
    let done = false;
    let idle: number | undefined;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && load(), { rootMargin: "600px 0px" });
    function load() {
      if (done) return;
      done = true;
      io.disconnect();
      if (idle !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
      import("./StageImpl").then((m) => setLive(() => m.Stage));
    }
    // Chargement anticipé si le stage approche du viewport (lien d'ancre, scroll rapide).
    const root = document.getElementById("boucle");
    if (root) io.observe(root);
    if ("requestIdleCallback" in window) idle = window.requestIdleCallback(load, { timeout: 1500 });
    else setTimeout(load, 300);
    return () => {
      done = true;
      io.disconnect();
      if (idle !== undefined && "cancelIdleCallback" in window) window.cancelIdleCallback(idle);
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
