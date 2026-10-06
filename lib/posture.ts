import type { ImplementationStatus, ZtLevel } from "@/db/schema";

export const ZT_LEVELS = ["basic", "intermediate", "advanced"] as const satisfies readonly ZtLevel[];

export type PillarPostureLevel = ZtLevel | "none";

export type LevelCounts = {
  met: number;
  inProgress: number;
  notStarted: number;
  notApplicable: number;
  /** Mean completion percent (0–100) of applicable outcomes at this tier. */
  progress: number;
};

export type OutcomeAssessment = {
  ztLevel: ZtLevel;
  status: ImplementationStatus | null;
  currentPercentage: number;
  targetPercentage: number;
};

function emptyCounts(): LevelCounts {
  return { met: 0, inProgress: 0, notStarted: 0, notApplicable: 0, progress: 0 };
}

export function outcomeCompletion(outcome: OutcomeAssessment): number | null {
  if (outcome.status === "not_applicable") return null;
  const target = outcome.targetPercentage > 0 ? outcome.targetPercentage : 100;
  const ratio = outcome.currentPercentage / target;
  return Math.max(0, Math.min(1, ratio));
}

export function isOutcomeMet(outcome: OutcomeAssessment): boolean {
  if (outcome.status === "not_applicable") return false;
  return outcome.currentPercentage >= outcome.targetPercentage;
}

function applicableAt(level: ZtLevel, outcomes: OutcomeAssessment[]) {
  return outcomes.filter(
    (outcome) => outcome.ztLevel === level && outcome.status !== "not_applicable",
  );
}

function isLevelMet(candidate: ZtLevel, outcomes: OutcomeAssessment[]) {
  const applicable = applicableAt(candidate, outcomes);
  if (applicable.length === 0) return false;
  if (applicable.some((outcome) => !isOutcomeMet(outcome))) return false;

  const through = ZT_LEVELS.indexOf(candidate);
  for (let index = 0; index < through; index += 1) {
    const lower = applicableAt(ZT_LEVELS[index], outcomes);
    if (lower.some((outcome) => !isOutcomeMet(outcome))) return false;
  }
  return true;
}

export function summarizePillar(outcomes: OutcomeAssessment[]) {
  const byLevel: Record<ZtLevel, LevelCounts> = {
    basic: emptyCounts(),
    intermediate: emptyCounts(),
    advanced: emptyCounts(),
  };

  const completionSums: Record<ZtLevel, { sum: number; count: number }> = {
    basic: { sum: 0, count: 0 },
    intermediate: { sum: 0, count: 0 },
    advanced: { sum: 0, count: 0 },
  };

  for (const outcome of outcomes) {
    const counts = byLevel[outcome.ztLevel];
    if (outcome.status === "not_applicable") {
      counts.notApplicable += 1;
      continue;
    }

    const completion = outcomeCompletion(outcome) ?? 0;
    completionSums[outcome.ztLevel].sum += completion;
    completionSums[outcome.ztLevel].count += 1;

    if (isOutcomeMet(outcome)) {
      counts.met += 1;
    } else if (outcome.currentPercentage > 0) {
      counts.inProgress += 1;
    } else {
      counts.notStarted += 1;
    }
  }

  for (const level of ZT_LEVELS) {
    const { sum, count } = completionSums[level];
    byLevel[level].progress = count === 0 ? 0 : (sum / count) * 100;
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

export function normalizeStatementStatus(
  status: ImplementationStatus,
  currentPercentage: number,
  targetPercentage: number,
): ImplementationStatus {
  if (status === "not_applicable") return "not_applicable";
  if (currentPercentage >= targetPercentage) return "implemented";
  if (currentPercentage > 0) return "in_progress";
  return "not_started";
}
