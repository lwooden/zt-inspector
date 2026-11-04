"use client";

import { useState } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { PillarCapabilityProgress } from "@/lib/queries/projects";

type CapabilityProgressChartProps = {
	pillars: PillarCapabilityProgress[];
};

const PERCENT_TICKS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

const selectClass =
	"mt-3 w-full max-w-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent";

function formatPercent(value: number) {
	return `${Math.round(value)}%`;
}

export function CapabilityProgressChart({
	pillars,
}: CapabilityProgressChartProps) {
	const [pillarId, setPillarId] = useState(pillars[0]?.pillarId ?? null);
	const selected =
		pillars.find((pillar) => pillar.pillarId === pillarId) ??
		pillars[0] ??
		null;
	const rows = selected?.statements ?? [];
	const height = Math.max(240, rows.length * 36 + 48);

	return (
		<div className="border border-border bg-surface px-4 py-4">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">
				Progress By Sub Capability By Pillar
			</h2>
			<p className="mt-1 text-sm text-muted">
				Each bar represents the progress of a sub capability within a pillar
				based on its current progress. Not applicable statements are omitted.
			</p>
			{pillars.length > 0 ? (
				<label className="block text-sm">
					<span className="sr-only">Pillar</span>
					<select
						className={selectClass}
						value={selected?.pillarId ?? ""}
						onChange={(event) => setPillarId(Number(event.target.value))}
					>
						{pillars.map((pillar) => (
							<option key={pillar.pillarId} value={pillar.pillarId}>
								{pillar.pillarName}
							</option>
						))}
					</select>
				</label>
			) : null}
			{rows.length === 0 ? (
				<p className="mt-4 border border-border bg-background px-4 py-3 text-sm text-muted">
					No applicable statements for this pillar.
				</p>
			) : (
				<div className="mt-4 w-full" style={{ height }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={rows}
							layout="vertical"
							margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
						>
							<CartesianGrid
								stroke="var(--border)"
								strokeDasharray="3 3"
								horizontal={false}
							/>
							<XAxis
								type="number"
								domain={[0, 100]}
								ticks={PERCENT_TICKS}
								tickFormatter={formatPercent}
								tick={{ fill: "var(--muted)", fontSize: 11 }}
								axisLine={{ stroke: "var(--border)" }}
								tickLine={{ stroke: "var(--border)" }}
							/>
							<YAxis
								type="category"
								dataKey="outcomeCode"
								width={88}
								reversed
								tick={{ fill: "var(--muted)", fontSize: 11 }}
								axisLine={{ stroke: "var(--border)" }}
								tickLine={{ stroke: "var(--border)" }}
							/>
							<Tooltip
								cursor={{ fill: "rgba(15, 118, 110, 0.06)" }}
								contentStyle={{
									border: "1px solid var(--border)",
									background: "var(--surface)",
									color: "var(--foreground)",
									borderRadius: 0,
									boxShadow: "none",
								}}
								formatter={(value) => {
									const pct = typeof value === "number" ? value : Number(value);
									return [formatPercent(pct), "Progress"];
								}}
								labelFormatter={(_label, payload) => {
									const row = payload?.[0]?.payload as
										| PillarCapabilityProgress["statements"][number]
										| undefined;
									if (!row) return String(_label);
									return `${row.outcomeCode} · ${row.capabilityCode} ${row.capabilityName}`;
								}}
							/>
							<Bar
								dataKey="progress"
								name="Progress"
								fill="var(--accent)"
								maxBarSize={18}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	);
}
