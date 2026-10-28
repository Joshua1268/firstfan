const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Abidjan",
});

// "27 oct. 2026, 14:05"
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
