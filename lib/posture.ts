import type { ImplementationStatus, ZtLevel } from "@/db/schema";

export const ZT_LEVELS = ["basic", "intermediate", "advanced"] as const satisfies readonly ZtLevel[];

export type PillarPostureLevel = ZtLevel | "none";

export type LevelCounts = {
  implemented: number;
  partial: number;
  notStarted: number;
  notApplicable: number;
};

export type OutcomeAssessment = {
  ztLevel: ZtLevel;
  status: ImplementationStatus | null;
};

function emptyCounts(): LevelCounts {
  return { implemented: 0, partial: 0, notStarted: 0, notApplicable: 0 };
}

function applicableAt(level: ZtLevel, outcomes: OutcomeAssessment[]) {
  return outcomes.filter(
    (outcome) => outcome.ztLevel === level && outcome.status !== "not_applicable",
  );
}

function isLevelMet(candidate: ZtLevel, outcomes: OutcomeAssessment[]) {
  const applicable = applicableAt(candidate, outcomes);
  if (applicable.length === 0) return false;
  if (applicable.some((outcome) => outcome.status !== "implemented")) return false;

  const through = ZT_LEVELS.indexOf(candidate);
  for (let index = 0; index < through; index += 1) {
    const lower = applicableAt(ZT_LEVELS[index], outcomes);
    if (lower.some((outcome) => outcome.status !== "implemented")) return false;
  }
  return true;
}

export function summarizePillar(outcomes: OutcomeAssessment[]) {
  const byLevel: Record<ZtLevel, LevelCounts> = {
    basic: emptyCounts(),
    intermediate: emptyCounts(),
    advanced: emptyCounts(),
  };

  for (const outcome of outcomes) {
    const counts = byLevel[outcome.ztLevel];
    switch (outcome.status) {
      case "implemented":
        counts.implemented += 1;
        break;
      case "partial":
        counts.partial += 1;
        break;
      case "not_applicable":
        counts.notApplicable += 1;
        break;
      case "not_started":
      case null:
        counts.notStarted += 1;
        break;
      default: {
        const unhandled: never = outcome.status;
        throw new Error(`Unhandled implementation status: ${String(unhandled)}`);
      }
    }
  }

  let level: PillarPostureLevel = "none";
  for (const candidate of ZT_LEVELS) {
    if (isLevelMet(candidate, outcomes)) {
      level = candidate;
      continue;
    }
    if (applicableAt(candidate, outcomes).length > 0) break;
  }

  return { level, byLevel };
}
