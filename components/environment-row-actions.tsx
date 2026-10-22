"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { toast } from "sonner";
import { deleteEnvironment } from "@/app/actions/environments";

type EnvironmentRowActionsProps = {
  environmentId: number;
  environmentName: string;
};

const iconButtonClass =
  "inline-flex size-8 items-center justify-center border border-transparent text-muted transition-colors hover:border-border hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function EnvironmentRowActions({
  environmentId,
  environmentName,
}: EnvironmentRowActionsProps) {
  const router = useRouter();

  function onDeleteClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    toast.warning(`Delete “${environmentName}”? This cannot be undone.`, {
      duration: 12_000,
      action: {
        label: "Delete",
        onClick: () => {
          void (async () => {
            const result = await deleteEnvironment(environmentId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Environment deleted");
            router.refresh();
          })();
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => undefined,
      },
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/environments/${environmentId}/edit`}
        aria-label={`Edit ${environmentName}`}
        className={`${iconButtonClass} text-foreground hover:text-accent`}
        onClick={(event) => event.stopPropagation()}
      >
        <Pencil className="size-4" aria-hidden strokeWidth={2} />
      </Link>
      <button
        type="button"
        aria-label={`Delete ${environmentName}`}
        className={`${iconButtonClass} text-red-700 hover:border-red-200 hover:bg-red-50 hover:text-red-800`}
        onClick={onDeleteClick}
      >
        <Trash2 className="size-4" aria-hidden strokeWidth={2} />
      </button>
    </div>
  );
}
