import type { Metadata } from "next";
import { CampaignPage } from "@/features/campaigns/dev/CampaignPage";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Campagne · ${PRODUCT_NAME}` };

export default async function CampaignRoute({ params }: { params: Promise<{ id: string }> }) {
  return <CampaignPage campaignId={Number((await params).id)} />;
}
