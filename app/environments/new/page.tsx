import Link from "next/link";
import { EnvironmentCreateForm } from "@/components/environment-create-form";

export default function NewEnvironmentPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/environments"
          className="w-fit text-sm text-muted underline-offset-2 hover:text-accent hover:underline"
        >
          Back to environments
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Add environment
          </h1>
          <p className="mt-1 text-sm text-muted">
            Creates a catalogue of implementation statements that projects in this environment
            inherit.
          </p>
        </div>
      </div>
      <EnvironmentCreateForm />
    </div>
  );
}
