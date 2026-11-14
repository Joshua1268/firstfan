const dateTime = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Abidjan",
});

const date = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Abidjan",
});

// "27 oct. 2026, 14:05"
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

// "27 octobre 2026"
export function formatDate(iso: string): string {
  return date.format(new Date(iso));
}
