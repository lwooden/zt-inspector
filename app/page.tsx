import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchProjects } from "@/app/actions/projects";
import { ProjectList } from "@/components/project-list";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await fetchProjects();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
          <p className="mt-1 text-sm text-muted">
            Browse systems and open a project to review Zero Trust posture across the seven
            pillars.
          </p>
        </div>
        <Button href="/projects/new">
          <Plus className="size-4 shrink-0" aria-hidden strokeWidth={2.25} />
          Add Project
        </Button>
      </div>
      <ProjectList projects={projects} />
    </div>
  );
}
