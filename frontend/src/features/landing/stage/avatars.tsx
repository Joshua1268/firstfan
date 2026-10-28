// Decorative line avatars: the nearby name carries the meaning.

type Props = { size?: number; className?: string };

function Frame({ size = 40, className = "", children }: Props & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`flex-none rounded-full bg-bg text-ink ${className}`}
    >
      <circle cx="20" cy="20" r="19.25" stroke="var(--line)" />
      {children}
    </svg>
  );
}

export function CodeAvatar(props: Props) {
  return (
    <Frame {...props}>
      <circle cx="20" cy="15" r="5" />
      <path d="M11 31c1.6-4.6 5-7 9-7s7.4 2.4 9 7" />
      <path d="M14.5 13.5 12 15l2.5 1.5M25.5 13.5 28 15l-2.5 1.5" stroke="var(--ink-muted)" />
    </Frame>
  );
}

export function JobAvatar(props: Props) {
  return (
    <Frame {...props}>
      <path d="M14.5 15.5c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6" />
      <circle cx="20" cy="16" r="4.6" />
      <path d="M11 31c1.6-4.6 5-7 9-7s7.4 2.4 9 7" />
      <rect x="23.5" y="25" width="6" height="7" rx="1" stroke="var(--ink-muted)" />
      <path d="M25 27.5h3M25 29.5h2" stroke="var(--ink-muted)" />
    </Frame>
  );
}
