"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { updateProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import type { Environment } from "@/lib/types/environments";
import type { Project } from "@/lib/types/projects";

type ProjectEditFormProps = {
  project: Project;
  environments: Environment[];
};

export function ProjectEditForm({ project, environments }: ProjectEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [governmentItpm, setGovernmentItpm] = useState(project.governmentItpm);
  const [divisionOwner, setDivisionOwner] = useState(project.divisionOwner);
  const [environmentId, setEnvironmentId] = useState(String(project.environmentId));
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    governmentItpm?: string;
    divisionOwner?: string;
    environmentId?: string;
  }>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: typeof fieldErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!governmentItpm.trim()) nextErrors.governmentItpm = "Government ITPM is required";
    if (!divisionOwner.trim()) nextErrors.divisionOwner = "Owning division is required";
    if (!environmentId) nextErrors.environmentId = "Environment is required";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPending(true);
    try {
      const result = await updateProject(project.id, {
        name: name.trim(),
        governmentItpm: governmentItpm.trim(),
        divisionOwner: divisionOwner.trim(),
        environmentId: Number(environmentId),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Project updated");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to update project");
    } finally {
      setPending(false);
    }
  }

  const inputClass =
    "mt-1 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent";

  return (
    <form onSubmit={onSubmit} className="border border-border bg-surface px-5 py-5">
      <div className="flex flex-col gap-4">
        <label className="block text-sm">
          <span className="font-medium text-foreground">Environment</span>
          <select
            className={inputClass}
            value={environmentId}
            onChange={(event) => setEnvironmentId(event.target.value)}
            disabled={pending}
          >
            {environments.map((environment) => (
              <option key={environment.id} value={environment.id}>
                {environment.name}
              </option>
            ))}
          </select>
          {fieldErrors.environmentId ? (
            <span className="mt-1 block text-xs text-red-700">
              {fieldErrors.environmentId}
            </span>
          ) : null}
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Name</span>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
            autoComplete="off"
          />
          {fieldErrors.name ? (
            <span className="mt-1 block text-xs text-red-700">{fieldErrors.name}</span>
          ) : null}
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Government ITPM</span>
          <input
            className={inputClass}
            value={governmentItpm}
            onChange={(event) => setGovernmentItpm(event.target.value)}
            disabled={pending}
            autoComplete="off"
          />
          {fieldErrors.governmentItpm ? (
            <span className="mt-1 block text-xs text-red-700">
              {fieldErrors.governmentItpm}
            </span>
          ) : null}
        </label>

        <label className="block text-sm">
          <span className="font-medium text-foreground">Owning division</span>
          <input
            className={inputClass}
            value={divisionOwner}
            onChange={(event) => setDivisionOwner(event.target.value)}
            disabled={pending}
            autoComplete="off"
          />
          {fieldErrors.divisionOwner ? (
            <span className="mt-1 block text-xs text-red-700">
              {fieldErrors.divisionOwner}
            </span>
          ) : null}
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          href="/"
          variant="secondary"
          className={pending ? "pointer-events-none opacity-50" : undefined}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
