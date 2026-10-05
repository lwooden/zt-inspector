"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { upsertStatement } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import type { ImplementationStatus } from "@/db/schema";
import type { PillarOutcomeAssessment } from "@/lib/types/projects";

type OutcomeStatementCardProps = {
  projectId: number;
  outcome: PillarOutcomeAssessment;
};

const STATUS_OPTIONS: { value: ImplementationStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "partial", label: "Partial" },
  { value: "implemented", label: "Implemented" },
  { value: "not_applicable", label: "Not applicable" },
];

function formatStatus(status: PillarOutcomeAssessment["status"]) {
  if (status === null) return "not assessed";
  return status.replaceAll("_", " ");
}

const fieldClass =
  "mt-1 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const iconButtonClass =
  "inline-flex size-8 items-center justify-center border border-transparent text-foreground transition-colors hover:border-border hover:bg-background hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function OutcomeStatementCard({ projectId, outcome }: OutcomeStatementCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<ImplementationStatus>(
    outcome.status ?? "not_started",
  );
  const [statement, setStatement] = useState(outcome.statement ?? "");
  const [pending, setPending] = useState(false);

  function startEditing() {
    setStatus(outcome.status ?? "not_started");
    setStatement(outcome.statement ?? "");
    setEditing(true);
  }

  function cancelEditing() {
    setStatus(outcome.status ?? "not_started");
    setStatement(outcome.statement ?? "");
    setEditing(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const trimmed = statement.trim();
      const result = await upsertStatement(projectId, outcome.id, {
        status,
        statement: trimmed === "" ? null : trimmed,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Statement updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update statement");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="border border-border bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-foreground">{outcome.code}</h3>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {outcome.capabilityCode} - {outcome.capabilityName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block border border-border bg-background px-2 py-0.5 font-mono text-xs lowercase text-foreground">
            {outcome.ztLevel}
          </span>
          {!editing ? (
            <button
              type="button"
              aria-label={`Edit statement for ${outcome.code}`}
              className={iconButtonClass}
              onClick={startEditing}
            >
              <Pencil className="size-4" aria-hidden strokeWidth={2} />
            </button>
          ) : null}
        </div>
      </div>

      {editing ? (
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted">
                Measurable outcome
              </p>
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {outcome.definition}
              </p>
            </div>
            <label className="block min-w-0 text-sm">
              <span className="text-xs uppercase tracking-wide text-muted">
                Implementation Details
              </span>
              <textarea
                className={`${fieldClass} min-h-28 resize-y`}
                value={statement}
                onChange={(event) => setStatement(event.target.value)}
                disabled={pending}
              />
            </label>
            <label className="block text-sm md:w-44 md:shrink-0">
              <span className="text-xs uppercase tracking-wide text-muted">Status</span>
              <select
                className={fieldClass}
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ImplementationStatus)
                }
                disabled={pending}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={cancelEditing}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-start">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted">
              Measurable outcome
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
              {outcome.definition}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted">
              Implementation Details
            </p>
            {outcome.statement != null && outcome.statement.trim() !== "" ? (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                {outcome.statement}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">No implementation statement yet</p>
            )}
          </div>
          <div className="md:w-36 md:shrink-0 md:text-right">
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <p className="mt-1 font-mono text-xs lowercase text-foreground">
              {formatStatus(outcome.status)}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
