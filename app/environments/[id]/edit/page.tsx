import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchEnvironment } from "@/app/actions/environments";
import { EnvironmentEditForm } from "@/components/environment-edit-form";

export const dynamic = "force-dynamic";

type EditEnvironmentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEnvironmentPage({ params }: EditEnvironmentPageProps) {
  const { id } = await params;
  const environment = await fetchEnvironment(id);
  if (!environment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={`/environments/${environment.id}`}
          className="w-fit text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Back to {environment.name}
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Edit environment
          </h1>
          <p className="mt-1 text-sm text-muted">Update {environment.name}.</p>
        </div>
      </div>
      <EnvironmentEditForm environment={environment} />
    </div>
  );
}
