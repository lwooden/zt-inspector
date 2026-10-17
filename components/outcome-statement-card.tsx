"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { revertStatement, upsertStatement } from "@/app/actions/projects";
import { upsertEnvironmentStatement } from "@/app/actions/environments";
import { Button } from "@/components/ui/button";
import type { ImplementationStatus } from "@/db/schema";
import { normalizeStatementStatus } from "@/lib/posture";
import type { PillarOutcomeAssessment } from "@/lib/types/projects";

type OutcomeStatementCardProps = {
  outcome: PillarOutcomeAssessment;
  projectId?: number;
  environmentId?: number;
  environmentName?: string;
};

const STATUS_OPTIONS: { value: ImplementationStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "implemented", label: "Implemented" },
  { value: "not_applicable", label: "Not applicable" },
];

const CURRENT_PERCENTAGE_OPTIONS = Array.from({ length: 21 }, (_, index) => index * 5);

function formatStatus(status: PillarOutcomeAssessment["status"]) {
  if (status === null) return "not assessed";
  return status.replaceAll("_", " ");
}

const fieldClass =
  "mt-1 w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent";

const iconButtonClass =
  "inline-flex size-8 items-center justify-center border border-transparent text-foreground transition-colors hover:border-border hover:bg-background hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function OutcomeStatementCard({
  projectId,
  environmentId,
  environmentName,
  outcome,
}: OutcomeStatementCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<ImplementationStatus>(
    outcome.status ?? "not_started",
  );
  const [statement, setStatement] = useState(outcome.statement ?? "");
  const [currentPercentage, setCurrentPercentage] = useState(outcome.currentPercentage);
  const [targetPercentage, setTargetPercentage] = useState(outcome.targetPercentage);
  const [pending, setPending] = useState(false);

  const percentageDisabled = status === "not_applicable" || pending;

  function resetForm() {
    setStatus(outcome.status ?? "not_started");
    setStatement(outcome.statement ?? "");
    setCurrentPercentage(outcome.currentPercentage);
    setTargetPercentage(outcome.targetPercentage);
  }

  function startEditing() {
    resetForm();
    setEditing(true);
  }

  function cancelEditing() {
    resetForm();
    setEditing(false);
  }

  function onStatusChange(next: ImplementationStatus) {
    setStatus(next);
    if (next === "implemented") {
      setCurrentPercentage(targetPercentage);
    } else if (next === "not_started") {
      setCurrentPercentage(0);
    } else if (next === "in_progress" && currentPercentage === 0) {
      setCurrentPercentage(5);
    }
  }

  function onCurrentPercentageChange(next: number) {
    setCurrentPercentage(next);
    if (status === "not_applicable") return;
    setStatus(normalizeStatementStatus("not_started", next, targetPercentage));
  }

  function onTargetPercentageChange(next: number) {
    const clamped = Math.max(1, Math.min(100, next));
    setTargetPercentage(clamped);
    if (status === "not_applicable") return;
    setStatus(normalizeStatementStatus(status, currentPercentage, clamped));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const trimmed = statement.trim();
      const input = {
        status,
        statement: trimmed === "" ? null : trimmed,
        currentPercentage,
        targetPercentage,
      };
      const result =
        projectId != null
          ? await upsertStatement(projectId, outcome.id, input)
          : await upsertEnvironmentStatement(environmentId ?? "", outcome.id, input);

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

  async function onRevert() {
    if (projectId == null) return;
    setPending(true);
    try {
      const result = await revertStatement(projectId, outcome.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Reverted to environment");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to revert statement");
    } finally {
      setPending(false);
    }
  }

  const custodyLabel =
    projectId == null
      ? null
      : outcome.source === "project"
        ? "Project override"
        : `Inherited from ${environmentName ?? "environment"}`;

  return (
    <li className="border border-border bg-surface px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-foreground">{outcome.code}</h3>
          <p className="mt-0.5 font-mono text-xs text-muted">
            {outcome.capabilityCode} - {outcome.capabilityName}
          </p>
          {custodyLabel ? (
            <p className="mt-1 text-xs text-muted">{custodyLabel}</p>
          ) : null}
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-start">
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
            <div className="flex flex-col gap-3 md:w-44 md:shrink-0">
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-muted">Status</span>
                <select
                  className={fieldClass}
                  value={status}
                  onChange={(event) =>
                    onStatusChange(event.target.value as ImplementationStatus)
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
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-muted">
                  Current %
                </span>
                <select
                  className={fieldClass}
                  value={currentPercentage}
                  onChange={(event) =>
                    onCurrentPercentageChange(Number(event.target.value))
                  }
                  disabled={percentageDisabled}
                >
                  {CURRENT_PERCENTAGE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}%
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-xs uppercase tracking-wide text-muted">
                  Target %
                </span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  className={fieldClass}
                  value={targetPercentage}
                  onChange={(event) =>
                    onTargetPercentageChange(Number(event.target.value))
                  }
                  disabled={percentageDisabled}
                />
              </label>
            </div>
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
            {projectId != null && outcome.source === "project" ? (
              <Button type="button" variant="secondary" disabled={pending} onClick={onRevert}>
                Use environment
              </Button>
            ) : null}
          </div>
        </form>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-start">
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
          <div className="md:w-44 md:shrink-0 md:text-right">
            <p className="text-xs uppercase tracking-wide text-muted">Status</p>
            <p className="mt-1 font-mono text-xs lowercase text-foreground">
              {formatStatus(outcome.status)}
            </p>
            <p className="mt-3 text-xs uppercase tracking-wide text-muted">Progress</p>
            <p className="mt-1 font-mono text-xs text-foreground">
              {outcome.currentPercentage}% / {outcome.targetPercentage}%
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
