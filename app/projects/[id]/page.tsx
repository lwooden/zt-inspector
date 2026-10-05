import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchProject, fetchProjectPosture } from "@/app/actions/projects";
import { PillarPostureList } from "@/components/pillar-posture";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const [project, posture] = await Promise.all([fetchProject(id), fetchProjectPosture(id)]);

  if (!project || !posture) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="w-fit text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Back to projects
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-surface px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted">Government ITPM</dt>
              <dd className="mt-1 text-sm text-foreground">{project.governmentItpm}</dd>
            </div>
            <div className="border border-border bg-surface px-4 py-3">
              <dt className="text-xs uppercase tracking-wide text-muted">Owning division</dt>
              <dd className="mt-1 text-sm text-foreground">{project.divisionOwner}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Pillar posture</h2>
          <p className="mt-1 text-sm text-muted">
            Read-only summary of assessed desired outcomes by pillar and maturity level.
          </p>
        </div>
        <PillarPostureList projectId={project.id} pillars={posture.pillars} />
      </section>
    </div>
  );
}
