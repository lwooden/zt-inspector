import Link from "next/link";
import { ProjectCreateForm } from "@/components/project-create-form";

export default function NewProjectPage() {
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
            Create a system record. Measurable outcomes will start as not started.
          </p>
        </div>
      </div>
      <ProjectCreateForm />
    </div>
  );
}
