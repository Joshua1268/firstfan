/**
 * Sans JS : feuille servie dans un <noscript> par la page (module serveur, pas « use client »).
 * Elle force l'état final des entrées `whileInView` et retire les caches d'animation.
 */
export const REVEAL_NO_JS =
  "<style>[data-reveal]{opacity:1!important;transform:none!important}[data-reveal-path]{stroke-dasharray:none!important;stroke-dashoffset:0!important;opacity:1!important}[data-armed]{display:none!important}.cta-word{transform:none!important}</style>";
