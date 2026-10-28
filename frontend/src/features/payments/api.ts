import { apiFetch } from "@/lib/api-client";
import type { Payment } from "./types";

export function getPayment(reference: string): Promise<Payment> {
  return apiFetch(`/api/payments/${reference}/`);
}

// Only exists while the payment provider is the simulated one.
export function simulatePayment(reference: string, outcome: "paid" | "failed"): Promise<Payment> {
  return apiFetch(`/api/payments/${reference}/simulate/`, { method: "POST", json: { outcome } });
}
