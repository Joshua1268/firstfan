export type PaymentStatus = "pending" | "paid" | "failed";

export type Payment = {
  reference: string;
  amount_xof: number;
  status: PaymentStatus;
  campaign_id: number;
};
