import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchEnvironment, fetchEnvironmentPosture } from "@/app/actions/environments";
import { PillarPostureList } from "@/components/pillar-posture";

export const dynamic = "force-dynamic";

type EnvironmentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EnvironmentPage({ params }: EnvironmentPageProps) {
  const { id } = await params;
  const [environment, posture] = await Promise.all([
    fetchEnvironment(id),
    fetchEnvironmentPosture(id),
  ]);

  if (!environment || !posture) notFound();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/environments"
          className="w-fit text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Back to environments
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {environment.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {environment.description.trim() === ""
              ? "No description yet."
              : environment.description}
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Pillar posture</h2>
          <p className="mt-1 text-sm text-muted">
            Base assessment inherited by projects in this environment.
          </p>
        </div>
        <PillarPostureList
          hrefBase={`/environments/${environment.id}`}
          pillars={posture.pillars}
        />
      </section>
    </div>
  );
}
