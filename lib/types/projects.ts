import type { LevelCounts, PillarPostureLevel } from "@/lib/posture";
import type { ImplementationStatus, ZtLevel } from "@/db/schema";

export type StatementSource = "project" | "environment";

export type Project = {
  id: number;
  environmentId: number;
  environmentName: string;
  name: string;
  governmentItpm: string;
  divisionOwner: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type PillarPosture = {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  level: PillarPostureLevel;
  byLevel: Record<ZtLevel, LevelCounts>;
};

export type ProjectPosture = {
  projectId: number;
  pillars: PillarPosture[];
};

export type PillarOutcomeAssessment = {
  id: number;
  code: string;
  definition: string;
  ztLevel: ZtLevel;
  capabilityCode: string;
  capabilityName: string;
  status: ImplementationStatus | null;
  statement: string | null;
  currentPercentage: number;
  targetPercentage: number;
  source: StatementSource;
};

export type ProjectPillarDetail = {
  projectId: number;
  pillar: {
    id: number;
    code: string;
    name: string;
    description: string;
  };
  level: PillarPostureLevel;
  outcomes: PillarOutcomeAssessment[];
};
