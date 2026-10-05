"use client";
// client component displayed inside of server shell

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { fetchProjectPosture } from "@/app/actions/projects";
import { MaturityChart } from "@/components/metrics/maturity-chart";
import { TierProgressChart } from "@/components/metrics/tier-progress-chart";
import { toMaturityChartRows, toTierProgressRows } from "@/lib/metrics";
import type { Project, ProjectPosture } from "@/lib/types/projects";

type MetricsDashboardProps = {
	projects: Project[];
	initialProjectId: number | null;
	initialPosture: ProjectPosture | null;
};

const selectClass =
	"w-full max-w-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function MetricsDashboard({
	projects,
	initialProjectId,
	initialPosture,
}: MetricsDashboardProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [projectId, setProjectId] = useState<number | null>(initialProjectId);
	const [posture, setPosture] = useState<ProjectPosture | null>(initialPosture);
	const [error, setError] = useState<string | null>(null);
	const [pending, startTransition] = useTransition();

	const selected = projects.find((project) => project.id === projectId) ?? null;

	function onProjectChange(nextId: string) {
		const id = Number(nextId);
		if (!Number.isFinite(id)) return;

		setProjectId(id);
		setError(null);

		const params = new URLSearchParams(searchParams.toString());
		params.set("projectId", String(id));
		router.replace(`/metrics?${params.toString()}`, { scroll: false });

		startTransition(async () => {
			try {
				const next = await fetchProjectPosture(id);
				if (!next) {
					setPosture(null);
					setError("Posture data was not found for this project.");
					return;
				}
				setPosture(next);
			} catch {
				setPosture(null);
				setError("Failed to load posture for this project.");
			}
		});
	}

	if (projects.length === 0) {
		return (
			<div className="border border-border bg-surface px-5 py-10 text-center text-sm text-muted">
				No projects yet. Create a project to view posture metrics.
			</div>
		);
	}

	const maturityRows = posture ? toMaturityChartRows(posture.pillars) : [];
	const progressRows = posture ? toTierProgressRows(posture.pillars) : [];

	return (
		<div className="flex flex-col gap-6">
			<label className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
				<span className="shrink-0 font-medium text-foreground">Project</span>
				<select
					className={selectClass}
					value={projectId ?? ""}
					onChange={(event) => onProjectChange(event.target.value)}
					disabled={pending}
				>
					{projects.map((project) => (
						<option key={project.id} value={project.id}>
							{project.name}
						</option>
					))}
				</select>
			</label>

			{selected ? (
				<p className="text-sm text-muted">
					Showing Zero Trust posture charts for{" "}
					<span className="font-medium text-foreground">{selected.name}</span>.
					{pending ? " Loading…" : null}
				</p>
			) : null}

			{error ? (
				<p className="border border-border bg-surface px-4 py-3 text-sm text-red-700">
					{error}
				</p>
			) : null}

			{!error && posture ? (
				<div className="flex flex-col gap-6">
					<MaturityChart data={maturityRows} />
					<TierProgressChart data={progressRows} />
				</div>
			) : null}

			{!error && !posture && !pending ? (
				<p className="border border-border bg-surface px-4 py-3 text-sm text-muted">
					Select a project to load metrics.
				</p>
			) : null}
		</div>
	);
}
