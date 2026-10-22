"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import type { Environment } from "@/lib/types/environments";

type ProjectCreateFormProps = {
  environments: Environment[];
};

export function ProjectCreateForm({ environments }: ProjectCreateFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [governmentItpm, setGovernmentItpm] = useState("");
  const [divisionOwner, setDivisionOwner] = useState("");
  const [environmentId, setEnvironmentId] = useState(
    environments[0] ? String(environments[0].id) : "",
  );
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
      const result = await createProject({
        name: name.trim(),
        governmentItpm: governmentItpm.trim(),
        divisionOwner: divisionOwner.trim(),
        environmentId: Number(environmentId),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Project created");
      router.push(`/projects/${result.project.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to create project");
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
            disabled={pending || environments.length === 0}
          >
            {environments.length === 0 ? (
              <option value="">No environments yet</option>
            ) : (
              environments.map((environment) => (
                <option key={environment.id} value={environment.id}>
                  {environment.name}
                </option>
              ))
            )}
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
        <Button type="submit" disabled={pending || environments.length === 0}>
          {pending ? "Creating…" : "Create project"}
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
