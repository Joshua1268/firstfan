const xof = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

// fr-FR groups thousands with a narrow no-break space: 5 000 FCFA.
export function formatXof(n: number): string {
  return `${xof.format(n)} FCFA`;
}
