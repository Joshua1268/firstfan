"use client";

import { useEffect, useState, type ComponentType } from "react";

// No Suspense: React 19 would stream it out of flow, hidden without JS.

type StageComponent = ComponentType;

// NEXT_RUNTIME is empty in the client bundle, so this require is compiled out there.
let ServerStage: StageComponent | null = null;
if (process.env.NEXT_RUNTIME) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- synchronous server render only
  ServerStage = (require("./StageImpl") as typeof import("./StageImpl")).Stage;
}

export function Stage() {
  const [Live, setLive] = useState<StageComponent | null>(null);

  useEffect(() => {
    const root = document.getElementById("boucle");
    let done = false;
    let idle: number | undefined;
    const io = new IntersectionObserver((e) => e.some((x) => x.isIntersecting) && load(), { rootMargin: "600px 0px" });
    // The static fallback is enough here.
    const staticOnly = window.matchMedia("(prefers-reduced-motion: reduce), (max-height: 359px)");
    const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
    const lowEnd =
      (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 4) || nav.connection?.saveData === true;
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
      else setTimeout(load, 300); // load() checks `done` and staticOnly
    }
    function load() {
      if (done || staticOnly.matches) return;
      done = true;
      stop();
      import("./StageImpl")
        .then((m) => {
          // Move focus to the same element in the animated stage.
          const active = document.activeElement;
          const href =
            active instanceof HTMLAnchorElement && root?.contains(active) ? active.getAttribute("href") : null;
          setLive(() => m.Stage);
          if (href)
            requestAnimationFrame(() =>
              root
                ?.querySelector<HTMLElement>(`.stage-live a[href="${CSS.escape(href)}"]`)
                ?.focus({ preventScroll: true }),
            );
        })
        // Chunk failed to load: the server HTML stays.
        .catch(() => {
          done = false;
        });
    }
    // The preference may change during the visit.
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
  // Keep the server HTML as is during hydration.
  return <div className="contents" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: "" }} />;
}
