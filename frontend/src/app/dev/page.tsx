import { ProjectList } from "@/features/projects/ProjectList";
import { SpaceTitle } from "@/ui/AppShell";

export default function DevHome() {
  return (
    <div className="flex flex-col gap-10">
      <SpaceTitle>Tes projets</SpaceTitle>
      <ProjectList />
    </div>
  );
}
