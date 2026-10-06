"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { TierProgressChartRow } from "@/lib/metrics";

type TierProgressChartProps = {
	data: TierProgressChartRow[];
};

const SERIES = [
	{ key: "basic", label: "Basic", color: "var(--accent)" },
	{ key: "intermediate", label: "Intermediate", color: "#334155" },
	{ key: "advanced", label: "Advanced", color: "#94a3b8" },
] as const;

function formatPercent(value: number) {
	return `${Math.round(value)}%`;
}

export function TierProgressChart({ data }: TierProgressChartProps) {
	return (
		<div className="border border-border bg-surface px-4 py-4">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">
				Implementation Progress By Maturity Tier
			</h2>
			<p className="mt-1 text-sm text-muted">
				Mean completion vs target for applicable outcomes at each tier (N/A
				excluded).
			</p>
			<div className="mt-4 h-80 w-full">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={data}
						margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
					>
						<CartesianGrid
							stroke="var(--border)"
							strokeDasharray="3 3"
							vertical={false}
						/>
						<XAxis
							dataKey="pillar"
							interval={0}
							angle={-28}
							textAnchor="end"
							height={70}
							tick={{ fill: "var(--muted)", fontSize: 11 }}
							axisLine={{ stroke: "var(--border)" }}
							tickLine={{ stroke: "var(--border)" }}
						/>
						<YAxis
							domain={[0, 100]}
							tickFormatter={formatPercent}
							width={48}
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
							formatter={(value, name, item) => {
								const row = item.payload as TierProgressChartRow | undefined;
								const key = String(name);
								const applicableKey =
									key === "Basic"
										? "basicApplicable"
										: key === "Intermediate"
											? "intermediateApplicable"
											: "advancedApplicable";
								const applicable = row?.[applicableKey] ?? 0;
								const pct = typeof value === "number" ? value : Number(value);
								if (applicable === 0) return ["No applicable outcomes", key];
								return [formatPercent(pct), key];
							}}
							labelFormatter={(label) => String(label)}
						/>
						<Legend
							wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
							iconType="square"
						/>
						{SERIES.map((series) => (
							<Bar
								key={series.key}
								dataKey={series.key}
								name={series.label}
								fill={series.color}
								maxBarSize={28}
							/>
						))}
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
