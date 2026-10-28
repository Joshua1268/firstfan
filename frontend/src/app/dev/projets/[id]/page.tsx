import type { Metadata } from "next";
import { CampaignForm } from "@/features/campaigns/dev/CampaignForm";
import { CampaignList } from "@/features/campaigns/dev/CampaignList";
import { ProjectOverview } from "@/features/projects/ProjectOverview";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = { title: `Projet · ${PRODUCT_NAME}` };

const h2Cls = "text-[length:var(--text-h3)] font-semibold leading-[var(--leading-h3)] text-ink";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const projectId = Number((await params).id);
  return (
    <ProjectOverview projectId={projectId}>
      <section className="flex flex-col gap-4">
        <h2 className={h2Cls}>Campagnes</h2>
        <CampaignList projectId={projectId} />
      </section>
      <section className="flex max-w-[720px] flex-col gap-6 border-t border-line pt-10">
        <h2 className={h2Cls}>Nouvelle campagne</h2>
        <CampaignForm projectId={projectId} />
      </section>
    </ProjectOverview>
  );
}
