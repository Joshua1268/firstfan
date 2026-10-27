import type { SVGProps } from "react";

/**
 * Jeu d'icônes de la landing : SVG au trait, stroke 1.5px, embouts arrondis, grille de 24px.
 * Décoratives par défaut (aria-hidden) : le texte voisin porte le sens.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9l6 6 6-6" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.15 1 5.85L12 16.95 6.75 19.7l1-5.85L3.5 9.7l5.9-.9L12 3.5z" />
    </Svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5l7 2.6v5.4c0 4.3-2.9 7.6-7 9-4.1-1.4-7-4.7-7-9V6.1l7-2.6z" />
      <path d="M8.75 12.25l2.25 2.25 4.25-4.5" />
    </Svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="6.5" y="3" width="11" height="18" rx="2.5" />
      <path d="M10.5 18h3" />
    </Svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
    </Svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-4 3.5v-3.5h0.5a2 2 0 0 1-2-2v-8z" />
      <path d="M8.5 9.5h7M8.5 12.5h4.5" />
    </Svg>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 16.5l4.5-4.5 3.5 3 7.5-8" />
      <path d="M15 7h4.5v4.5" />
    </Svg>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6.5v11M15 6.5v11" />
    </Svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M8 5.5v13l10.5-6.5L8 5.5z" />
    </Svg>
  );
}
