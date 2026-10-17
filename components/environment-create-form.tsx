"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { createEnvironment } from "@/app/actions/environments";
import { Button } from "@/components/ui/button";

export function EnvironmentCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }
    setNameError(null);
    setPending(true);
    try {
      const result = await createEnvironment({
        name: name.trim(),
        description: description.trim(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Environment created");
      router.push(`/environments/${result.environment.id}`);
      router.refresh();
    } catch {
      toast.error("Failed to create environment");
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
          <span className="font-medium text-foreground">Name</span>
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={pending}
            autoComplete="off"
          />
          {nameError ? <span className="mt-1 block text-xs text-red-700">{nameError}</span> : null}
        </label>
        <label className="block text-sm">
          <span className="font-medium text-foreground">Description</span>
          <textarea
            className={`${inputClass} min-h-24 resize-y`}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={pending}
          />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create environment"}
        </Button>
        <Button
          href="/environments"
          variant="secondary"
          className={pending ? "pointer-events-none opacity-50" : undefined}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
