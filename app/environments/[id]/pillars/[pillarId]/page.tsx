import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchEnvironment, fetchEnvironmentPillarDetail } from "@/app/actions/environments";
import { PillarLevelSections } from "@/components/pillar-level-sections";

export const dynamic = "force-dynamic";

type EnvironmentPillarPageProps = {
  params: Promise<{ id: string; pillarId: string }>;
};

export default async function EnvironmentPillarPage({ params }: EnvironmentPillarPageProps) {
  const { id, pillarId } = await params;
  const [environment, detail] = await Promise.all([
    fetchEnvironment(id),
    fetchEnvironmentPillarDetail(id, pillarId),
  ]);

  if (!environment || !detail) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/environments/${environment.id}`}
          className="w-fit text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Back to {environment.name}
        </Link>

        <div className="border border-border bg-surface px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {detail.pillar.name}
              </h1>
              <p className="mt-1 text-sm text-muted">{environment.name}</p>
            </div>
            <span className="inline-block border border-border bg-background px-2 py-0.5 font-mono text-xs lowercase text-foreground">
              {detail.level}
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">{detail.pillar.description}</p>
        </div>
      </div>

      <PillarLevelSections environmentId={environment.id} outcomes={detail.outcomes} />
    </div>
  );
}
