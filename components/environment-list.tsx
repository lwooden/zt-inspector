import Link from "next/link";
import { EnvironmentRowActions } from "@/components/environment-row-actions";
import type { Environment } from "@/lib/types/environments";

type EnvironmentListProps = {
  environments: Environment[];
};

export function EnvironmentList({ environments }: EnvironmentListProps) {
  if (environments.length === 0) {
    return (
      <div className="border border-border bg-surface px-5 py-10 text-center text-sm text-muted">
        No environments yet. Create one so projects can inherit its assessments.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border bg-surface">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-background/80 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {environments.map((environment) => (
            <tr key={environment.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3">
                <Link
                  href={`/environments/${environment.id}`}
                  className="font-medium text-accent underline-offset-2 hover:underline"
                >
                  {environment.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-foreground">
                {environment.description.trim() === "" ? "—" : environment.description}
              </td>
              <td className="px-4 py-3">
                <EnvironmentRowActions
                  environmentId={environment.id}
                  environmentName={environment.name}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
