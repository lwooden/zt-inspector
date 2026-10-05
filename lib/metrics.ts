import type { LevelCounts, PillarPostureLevel } from "@/lib/posture";
import { ZT_LEVELS } from "@/lib/posture";
import type { PillarPosture } from "@/lib/types/projects";
import type { ZtLevel } from "@/db/schema";

export const MATURITY_LABELS = ["none", "basic", "intermediate", "advanced"] as const;

export type MaturityChartRow = {
  pillarId: number;
  pillar: string;
  level: PillarPostureLevel;
  value: number;
};

export type TierProgressChartRow = {
  pillarId: number;
  pillar: string;
  basic: number;
  intermediate: number;
  advanced: number;
  basicApplicable: number;
  intermediateApplicable: number;
  advancedApplicable: number;
};

export function maturityOrdinal(level: PillarPostureLevel): number {
  switch (level) {
    case "none":
      return 0;
    case "basic":
      return 1;
    case "intermediate":
      return 2;
    case "advanced":
      return 3;
    default: {
      const unhandled: never = level;
      throw new Error(`Unhandled maturity level: ${String(unhandled)}`);
    }
  }
}

export function applicableCount(counts: LevelCounts): number {
  return counts.implemented + counts.partial + counts.notStarted;
}

export function implementedPercent(counts: LevelCounts): number | null {
  const applicable = applicableCount(counts);
  if (applicable === 0) return null;
  return (counts.implemented / applicable) * 100;
}

export function toMaturityChartRows(pillars: PillarPosture[]): MaturityChartRow[] {
  return pillars.map((pillar) => ({
    pillarId: pillar.id,
    pillar: pillar.name,
    level: pillar.level,
    value: maturityOrdinal(pillar.level),
  }));
}

function tierPercent(pillar: PillarPosture, level: ZtLevel): number {
  return implementedPercent(pillar.byLevel[level]) ?? 0;
}

export function toTierProgressRows(pillars: PillarPosture[]): TierProgressChartRow[] {
  return pillars.map((pillar) => ({
    pillarId: pillar.id,
    pillar: pillar.name,
    basic: tierPercent(pillar, "basic"),
    intermediate: tierPercent(pillar, "intermediate"),
    advanced: tierPercent(pillar, "advanced"),
    basicApplicable: applicableCount(pillar.byLevel.basic),
    intermediateApplicable: applicableCount(pillar.byLevel.intermediate),
    advancedApplicable: applicableCount(pillar.byLevel.advanced),
  }));
}

export { ZT_LEVELS };
