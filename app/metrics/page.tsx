import { Suspense } from "react";
import { fetchProjectPosture, fetchProjects } from "@/app/actions/projects";
import { MetricsDashboard } from "@/components/metrics/metrics-dashboard";

export const dynamic = "force-dynamic";

type MetricsPageProps = {
  searchParams: Promise<{ projectId?: string }>;
};

export default async function MetricsPage({ searchParams }: MetricsPageProps) {
  const { projectId: rawProjectId } = await searchParams;
  const projects = await fetchProjects();

  const requestedId = rawProjectId ? Number(rawProjectId) : NaN;
  const initialProject =
    projects.find((project) => project.id === requestedId) ?? projects[0] ?? null;

  const initialPosture = initialProject
    ? await fetchProjectPosture(initialProject.id)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Metrics</h1>
        <p className="mt-1 text-sm text-muted">
          Visualize Zero Trust maturity and implementation progress across the seven
          pillars for a selected project.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="border border-border bg-surface px-5 py-10 text-center text-sm text-muted">
            Loading metrics…
          </div>
        }
      >
        <MetricsDashboard
          key={initialProject?.id ?? "none"}
          projects={projects}
          initialProjectId={initialProject?.id ?? null}
          initialPosture={initialPosture}
        />
      </Suspense>
    </div>
  );
}
