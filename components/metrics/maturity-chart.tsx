"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { MATURITY_LABELS, type MaturityChartRow } from "@/lib/metrics";

type MaturityChartProps = {
	data: MaturityChartRow[];
};

function formatTick(value: number) {
	return MATURITY_LABELS[value] ?? String(value);
}

export function MaturityChart({ data }: MaturityChartProps) {
	return (
		<div className="border border-border bg-surface px-4 py-4">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">
				Achieved Maturity by Pillar
			</h2>
			<p className="mt-1 text-sm text-muted">
				Highest maturity tier met for each pillar (none through advanced).
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
							domain={[0, 3]}
							ticks={[0, 1, 2, 3]}
							tickFormatter={formatTick}
							width={96}
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
								const ordinal =
									typeof value === "number" ? value : Number(value);
								return [formatTick(ordinal), "Maturity"];
							}}
							labelFormatter={(label) => String(label)}
						/>
						<Bar
							dataKey="value"
							name="Maturity"
							fill="var(--accent)"
							maxBarSize={48}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
