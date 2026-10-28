import type { Metadata } from "next";
import { ProjectForm } from "@/features/projects/ProjectForm";
import { PRODUCT_NAME } from "@/lib/brand";
import { SpaceTitle } from "@/ui/AppShell";

export const metadata: Metadata = { title: `Déposer une app · ${PRODUCT_NAME}` };

export default function NewProjectPage() {
  return (
    <div className="flex max-w-[560px] flex-col gap-8">
      <div className="flex flex-col gap-3">
        <SpaceTitle>Dépose ton app</SpaceTitle>
        <p className="text-[16px] leading-[1.6] text-ink-muted">
          Au dépôt, on calcule l&apos;empreinte de ton app et on l&apos;horodate : tu reçois un certificat
          d&apos;antériorité à garder.
        </p>
      </div>
      <ProjectForm />
    </div>
  );
}
