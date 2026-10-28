import type { Metadata } from "next";
import { InvitationPage } from "@/features/campaigns/tester/InvitationPage";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Invitation · ${PRODUCT_NAME}` };

export default async function InvitationRoute({ params }: { params: Promise<{ id: string }> }) {
  return <InvitationPage invitationId={Number((await params).id)} />;
}
