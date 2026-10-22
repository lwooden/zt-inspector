import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProject, fetchProjectPillarDetail } from "@/app/actions/projects";
import { PillarLevelSections } from "@/components/pillar-level-sections";

export const dynamic = "force-dynamic";

type PillarPageProps = {
  params: Promise<{ id: string; pillarId: string }>;
};

export default async function ProjectPillarPage({ params }: PillarPageProps) {
  const { id, pillarId } = await params;
  const [project, detail] = await Promise.all([
    fetchProject(id),
    fetchProjectPillarDetail(id, pillarId),
  ]);

  if (!project || !detail) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="w-fit text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Back to {project.name}
        </Link>

        <div className="border border-border bg-surface px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {detail.pillar.name}
              </h1>
              <p className="mt-1 text-sm text-muted">{project.name}</p>
            </div>
            <span className="inline-block border border-border bg-background px-2 py-0.5 font-mono text-xs lowercase text-foreground">
              {detail.level}
            </span>
          </div>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            {detail.pillar.description}
          </p>
        </div>
      </div>

      <PillarLevelSections
        projectId={project.id}
        environmentName={project.environmentName}
        outcomes={detail.outcomes}
      />
    </div>
  );
}
