export type PaymentStatus = "pending" | "paid" | "failed";

export type Payment = {
  reference: string;
  amount_xof: number;
  status: PaymentStatus;
  campaign_id: number;
};

export type Earning = {
  amount_xof: number;
  project_name: string;
  created_at: string;
};

export type Withdrawal = {
  amount_xof: number;
  status: PaymentStatus;
  momo_number_masked: string;
  created_at: string;
};

export type Wallet = {
  balance_xof: number;
  momo_number: string;
  earnings: Earning[];
  withdrawals: Withdrawal[];
};
