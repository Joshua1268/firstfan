import type { PaymentStatus } from "./types";

// Same shape as the masked number the API sends with each withdrawal: 07 •• •• •• 01.
export function maskMomo(number: string): string {
  const digits = number.replace(/\s/g, "");
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 2)} •• •• •• ${digits.slice(-2)}`;
}

// "3 500", "3500" or "3.500" all mean 3500; anything else is not an amount.
export function parseAmount(input: string): number | null {
  const digits = input.replace(/[\s.]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  return Number(digits);
}

export const WITHDRAWAL_STATUS: Record<PaymentStatus, { tone: "waiting" | "success" | "danger"; label: string }> = {
  pending: { tone: "waiting", label: "En cours" },
  paid: { tone: "success", label: "Versé" },
  failed: { tone: "danger", label: "Échoué" },
};
