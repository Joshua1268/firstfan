import { apiFetch } from "@/lib/api-client";
import type { Payment, Wallet, Withdrawal } from "./types";

export function getPayment(reference: string): Promise<Payment> {
  return apiFetch(`/api/payments/${reference}/`);
}

// Only exists while the payment provider is the simulated one.
export function simulatePayment(reference: string, outcome: "paid" | "failed"): Promise<Payment> {
  return apiFetch(`/api/payments/${reference}/simulate/`, { method: "POST", json: { outcome } });
}

export function getWallet(): Promise<Wallet> {
  return apiFetch("/api/tester/wallet/");
}

export function withdraw(amount_xof: number): Promise<Withdrawal> {
  return apiFetch("/api/tester/withdrawals/", { method: "POST", json: { amount_xof } });
}
