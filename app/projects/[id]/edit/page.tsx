import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchEnvironments } from "@/app/actions/environments";
import { fetchProject } from "@/app/actions/projects";
import { ProjectEditForm } from "@/components/project-edit-form";

export const dynamic = "force-dynamic";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;
  const [project, environments] = await Promise.all([fetchProject(id), fetchEnvironments()]);
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="w-fit text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Back to projects
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Edit project
          </h1>
          <p className="mt-1 text-sm text-muted">
            Update the system record for {project.name}.
          </p>
        </div>
      </div>
      <ProjectEditForm project={project} environments={environments} />
    </div>
  );
}
