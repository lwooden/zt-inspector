import Link from "next/link";
import { fetchEnvironments } from "@/app/actions/environments";
import { ProjectCreateForm } from "@/components/project-create-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const environments = await fetchEnvironments();
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
            Add project
          </h1>
          <p className="mt-1 text-sm text-muted">
            Create a system record in an environment. Outcomes inherit that environment
            until the project overrides them.
          </p>
        </div>
      </div>
      <ProjectCreateForm environments={environments} />
    </div>
  );
}
