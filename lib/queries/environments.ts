import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  capabilities,
  environments,
  implementationStatements,
  measurableOutcomes,
  pillars,
  projects,
  type ImplementationStatus,
  type ZtLevel,
} from "@/db/schema";
import { summarizePillar, type OutcomeAssessment } from "@/lib/posture";
import type {
  Environment,
  EnvironmentPillarDetail,
  EnvironmentPosture,
} from "@/lib/types/environments";
import type { PillarPosture } from "@/lib/types/projects";

export type CreateEnvironmentInput = {
  name: string;
  description: string;
};

const defaultStatement = {
  status: "not_started" as const,
  statement: null,
  currentPercentage: 0,
  targetPercentage: 100,
};

export async function listEnvironments(): Promise<Environment[]> {
  return db.select().from(environments).orderBy(asc(environments.name));
}

export async function getEnvironment(id: number): Promise<Environment | null> {
  const environment = await db.query.environments.findFirst({
    where: eq(environments.id, id),
  });
  return environment ?? null;
}

export async function ensureEnvironmentCatalogue(environmentId: number): Promise<number> {
  const existing = await db
    .select({ measurableOutcomeId: implementationStatements.measurableOutcomeId })
    .from(implementationStatements)
    .where(eq(implementationStatements.environmentId, environmentId));

  const existingIds = existing.map((row) => row.measurableOutcomeId);
  const missingOutcomes =
    existingIds.length === 0
      ? await db.select({ id: measurableOutcomes.id }).from(measurableOutcomes)
      : await db
          .select({ id: measurableOutcomes.id })
          .from(measurableOutcomes)
          .where(notInArray(measurableOutcomes.id, existingIds));

  if (missingOutcomes.length === 0) return 0;

  await db.insert(implementationStatements).values(
    missingOutcomes.map((outcome) => ({
      environmentId,
      measurableOutcomeId: outcome.id,
      ...defaultStatement,
    })),
  );

  return missingOutcomes.length;
}

export async function ensureCatalogueForAllEnvironments(
  measurableOutcomeId: number,
): Promise<number> {
  const environmentRows = await db.select({ id: environments.id }).from(environments);
  if (environmentRows.length === 0) return 0;

  const alreadyLinked = await db
    .select({ environmentId: implementationStatements.environmentId })
    .from(implementationStatements)
    .where(
      and(
        eq(implementationStatements.measurableOutcomeId, measurableOutcomeId),
        sql`${implementationStatements.environmentId} is not null`,
      ),
    );

  const linked = new Set(
    alreadyLinked
      .map((row) => row.environmentId)
      .filter((id): id is number => id != null),
  );
  const missing = environmentRows.filter((environment) => !linked.has(environment.id));
  if (missing.length === 0) return 0;

  await db.insert(implementationStatements).values(
    missing.map((environment) => ({
      environmentId: environment.id,
      measurableOutcomeId,
      ...defaultStatement,
    })),
  );

  return missing.length;
}

export async function createEnvironmentWithCatalogue(
  input: CreateEnvironmentInput,
): Promise<Environment> {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(environments).values(input).returning();
    const outcomes = await tx.select({ id: measurableOutcomes.id }).from(measurableOutcomes);
    if (outcomes.length > 0) {
      await tx.insert(implementationStatements).values(
        outcomes.map((outcome) => ({
          environmentId: created.id,
          measurableOutcomeId: outcome.id,
          ...defaultStatement,
        })),
      );
    }
    return created;
  });
}

type AssessmentRow = {
  pillarId: number;
  code: string;
  name: string;
  sortOrder: number;
  outcomeId: number | null;
  ztLevel: ZtLevel | null;
  status: ImplementationStatus | null;
  currentPercentage: number | null;
  targetPercentage: number | null;
};

export function postureFromRows(rows: AssessmentRow[]): PillarPosture[] {
  const grouped = new Map<
    number,
    {
      id: number;
      code: string;
      name: string;
      sortOrder: number;
      outcomes: OutcomeAssessment[];
    }
  >();

  for (const row of rows) {
    let pillar = grouped.get(row.pillarId);
    if (!pillar) {
      pillar = {
        id: row.pillarId,
        code: row.code,
        name: row.name,
        sortOrder: row.sortOrder,
        outcomes: [],
      };
      grouped.set(row.pillarId, pillar);
    }
    if (row.outcomeId && row.ztLevel) {
      pillar.outcomes.push({
        ztLevel: row.ztLevel,
        status: row.status,
        currentPercentage: row.currentPercentage ?? 0,
        targetPercentage: row.targetPercentage ?? 100,
      });
    }
  }

  return [...grouped.values()]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((pillar) => {
      const summary = summarizePillar(pillar.outcomes);
      return {
        id: pillar.id,
        code: pillar.code,
        name: pillar.name,
        sortOrder: pillar.sortOrder,
        level: summary.level,
        byLevel: summary.byLevel,
      };
    });
}

export async function getEnvironmentPosture(id: number): Promise<EnvironmentPosture | null> {
  const environment = await getEnvironment(id);
  if (!environment) return null;

  await ensureEnvironmentCatalogue(id);

  const rows = await db
    .select({
      pillarId: pillars.id,
      code: pillars.code,
      name: pillars.name,
      sortOrder: pillars.sortOrder,
      outcomeId: measurableOutcomes.id,
      ztLevel: measurableOutcomes.ztLevel,
      status: implementationStatements.status,
      currentPercentage: implementationStatements.currentPercentage,
      targetPercentage: implementationStatements.targetPercentage,
    })
    .from(pillars)
    .leftJoin(capabilities, eq(capabilities.pillarId, pillars.id))
    .leftJoin(measurableOutcomes, eq(measurableOutcomes.capabilityId, capabilities.id))
    .leftJoin(
      implementationStatements,
      and(
        eq(implementationStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(implementationStatements.environmentId, id),
      ),
    )
    .orderBy(asc(pillars.sortOrder));

  return { environmentId: id, pillars: postureFromRows(rows) };
}

export async function getEnvironmentPillarDetail(
  environmentId: number,
  pillarId: number,
): Promise<EnvironmentPillarDetail | null> {
  const [environment, pillar] = await Promise.all([
    getEnvironment(environmentId),
    db.query.pillars.findFirst({ where: eq(pillars.id, pillarId) }),
  ]);
  if (!environment || !pillar) return null;

  await ensureEnvironmentCatalogue(environmentId);

  const rows = await db
    .select({
      outcomeId: measurableOutcomes.id,
      outcomeCode: measurableOutcomes.code,
      definition: measurableOutcomes.definition,
      ztLevel: measurableOutcomes.ztLevel,
      capabilityCode: capabilities.code,
      capabilityName: capabilities.name,
      status: implementationStatements.status,
      statement: implementationStatements.statement,
      currentPercentage: implementationStatements.currentPercentage,
      targetPercentage: implementationStatements.targetPercentage,
    })
    .from(capabilities)
    .innerJoin(measurableOutcomes, eq(measurableOutcomes.capabilityId, capabilities.id))
    .leftJoin(
      implementationStatements,
      and(
        eq(implementationStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(implementationStatements.environmentId, environmentId),
      ),
    )
    .where(eq(capabilities.pillarId, pillarId))
    .orderBy(asc(capabilities.code), asc(measurableOutcomes.code));

  const outcomes = rows.map((row) => ({
    id: row.outcomeId,
    code: row.outcomeCode,
    definition: row.definition,
    ztLevel: row.ztLevel,
    capabilityCode: row.capabilityCode,
    capabilityName: row.capabilityName,
    status: row.status,
    statement: row.statement,
    currentPercentage: row.currentPercentage ?? 0,
    targetPercentage: row.targetPercentage ?? 100,
    source: "environment" as const,
  }));

  const summary = summarizePillar(
    outcomes.map((outcome) => ({
      ztLevel: outcome.ztLevel,
      status: outcome.status,
      currentPercentage: outcome.currentPercentage,
      targetPercentage: outcome.targetPercentage,
    })),
  );

  return {
    environmentId,
    environmentName: environment.name,
    pillar: {
      id: pillar.id,
      code: pillar.code,
      name: pillar.name,
      description: pillar.description,
    },
    level: summary.level,
    outcomes,
  };
}

export async function countProjectsInEnvironment(environmentId: number): Promise<number> {
  const rows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.environmentId, environmentId));
  return rows.length;
}
