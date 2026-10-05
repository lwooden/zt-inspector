import Link from "next/link";
import type { Project } from "@/lib/types/projects";
import { ProjectRowActions } from "@/components/project-row-actions";

type ProjectListProps = {
  projects: Project[];
};

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="border border-border bg-surface px-5 py-10 text-center text-sm text-muted">
        No projects yet. Seed or create a project to begin assessing posture.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-background/80 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Government ITPM</th>
            <th className="px-4 py-3 font-medium">Owning division</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/projects/${project.id}`}
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  {project.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-foreground">{project.governmentItpm}</td>
              <td className="px-4 py-3 text-foreground">{project.divisionOwner}</td>
              <td className="px-4 py-3">
                <ProjectRowActions projectId={project.id} projectName={project.name} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
