export function contactEmail() {
  const v = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  return v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : null;
}
