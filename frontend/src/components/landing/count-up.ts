import { animate, type MotionValue } from "motion";
import { ease } from "../../lib/motion-tokens";

type Opts = { duration?: number; delay?: number; onComplete?: () => void };

/**
 * Comptage de la section En direct (§3.6) : de 0 à `value`, ease-out-quint, 1,2 s par défaut.
 * La MotionValue porte déjà la valeur du serveur (rendu serveur, sans JS, reduced-motion) : on la remet
 * à 0 au départ du comptage, sinon l'animation irait de `value` à `value`.
 */
export function startCountUp(
  count: MotionValue<number>,
  value: number,
  { duration = 1.2, delay = 0, onComplete }: Opts = {},
) {
  count.set(0);
  return animate(count, [0, value], {
    duration,
    delay,
    ease: ease.outQuint as unknown as [number, number, number, number],
    onComplete,
  });
}
