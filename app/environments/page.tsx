import { Plus } from "lucide-react";
import { fetchEnvironments } from "@/app/actions/environments";
import { EnvironmentList } from "@/components/environment-list";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EnvironmentsPage() {
  const environments = await fetchEnvironments();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Environments</h1>
          <p className="mt-1 text-sm text-muted">
            Base Zero Trust assessments that projects inherit until they override an outcome.
          </p>
        </div>
        <Button href="/environments/new">
          <Plus className="size-4 shrink-0" aria-hidden strokeWidth={2.25} />
          Add Environment
        </Button>
      </div>
      <EnvironmentList environments={environments} />
    </div>
  );
}
