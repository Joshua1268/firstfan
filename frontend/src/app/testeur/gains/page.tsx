import type { Metadata } from "next";
import { Wallet } from "@/features/payments/Wallet";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Mes gains · ${PRODUCT_NAME}` };

export default function TesterWalletPage() {
  return <Wallet />;
}
