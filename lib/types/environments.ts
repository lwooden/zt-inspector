import type { PillarPostureLevel } from "@/lib/posture";
import type { PillarOutcomeAssessment, PillarPosture } from "@/lib/types/projects";

export type Environment = {
  id: number;
  name: string;
  description: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type EnvironmentPosture = {
  environmentId: number;
  pillars: PillarPosture[];
};

export type EnvironmentPillarDetail = {
  environmentId: number;
  environmentName: string;
  pillar: {
    id: number;
    code: string;
    name: string;
    description: string;
  };
  level: PillarPostureLevel;
  outcomes: PillarOutcomeAssessment[];
};
