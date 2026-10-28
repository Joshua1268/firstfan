import { SimulatedCheckout } from "@/features/payments/SimulatedCheckout";

export default async function SimulatedPaymentRoute({ params }: { params: Promise<{ ref: string }> }) {
  return <SimulatedCheckout reference={(await params).ref} />;
}
