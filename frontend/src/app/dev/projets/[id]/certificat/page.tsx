import type { Metadata } from "next";
import { CertificatePrint } from "@/features/projects/CertificatePrint";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Certificat d'antériorité · ${PRODUCT_NAME}` };

export default async function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  return <CertificatePrint projectId={Number((await params).id)} />;
}
