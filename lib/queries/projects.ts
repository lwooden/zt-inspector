import { and, asc, eq, notInArray } from "drizzle-orm";
import { db } from "@/db";
import {
  capabilities,
  measurableOutcomes,
  implementationStatements,
  pillars,
  projects,
  type ZtLevel,
} from "@/db/schema";
import { summarizePillar, type OutcomeAssessment } from "@/lib/posture";
import type { Project, ProjectPillarDetail, ProjectPosture } from "@/lib/types/projects";

export type {
  Project,
  PillarPosture,
  ProjectPosture,
  ProjectPillarDetail,
  PillarOutcomeAssessment,
} from "@/lib/types/projects";

export type CreateProjectInput = {
  name: string;
  governmentItpm: string;
  divisionOwner: string;
};

export async function listProjects(): Promise<Project[]> {
  return db.select().from(projects).orderBy(asc(projects.name));
}

export async function getProject(id: number): Promise<Project | null> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
  return project ?? null;
}

export async function ensureProjectCatalogue(projectId: number): Promise<number> {
  const existing = await db
    .select({ measurableOutcomeId: implementationStatements.measurableOutcomeId })
    .from(implementationStatements)
    .where(eq(implementationStatements.projectId, projectId));

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
      projectId,
      measurableOutcomeId: outcome.id,
      status: "not_started" as const,
      statement: null,
    })),
  );

  return missingOutcomes.length;
}

export async function ensureCatalogueForAllProjects(
  measurableOutcomeId: number,
): Promise<number> {
  const projectRows = await db.select({ id: projects.id }).from(projects);
  if (projectRows.length === 0) return 0;

  const alreadyLinked = await db
    .select({ projectId: implementationStatements.projectId })
    .from(implementationStatements)
    .where(eq(implementationStatements.measurableOutcomeId, measurableOutcomeId));
  const linked = new Set(alreadyLinked.map((row) => row.projectId));
  const missingProjects = projectRows.filter((project) => !linked.has(project.id));
  if (missingProjects.length === 0) return 0;

  await db.insert(implementationStatements).values(
    missingProjects.map((project) => ({
      projectId: project.id,
      measurableOutcomeId,
      status: "not_started" as const,
      statement: null,
    })),
  );

  return missingProjects.length;
}

export async function createProjectWithCatalogue(
  input: CreateProjectInput,
): Promise<Project> {
  return db.transaction(async (tx) => {
    const [created] = await tx.insert(projects).values(input).returning();

    const outcomes = await tx
      .select({ id: measurableOutcomes.id })
      .from(measurableOutcomes);

    if (outcomes.length > 0) {
      await tx.insert(implementationStatements).values(
        outcomes.map((outcome) => ({
          projectId: created.id,
          measurableOutcomeId: outcome.id,
          status: "not_started" as const,
          statement: null,
        })),
      );
    }

    return created;
  });
}

export async function getProjectPosture(id: number): Promise<ProjectPosture | null> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    columns: { id: true },
  });
  if (!project) return null;

  await ensureProjectCatalogue(id);

  const rows = await db
    .select({
      pillarId: pillars.id,
      code: pillars.code,
      name: pillars.name,
      sortOrder: pillars.sortOrder,
      outcomeId: measurableOutcomes.id,
      ztLevel: measurableOutcomes.ztLevel,
      status: implementationStatements.status,
    })
    .from(pillars)
    .leftJoin(capabilities, eq(capabilities.pillarId, pillars.id))
    .leftJoin(measurableOutcomes, eq(measurableOutcomes.capabilityId, capabilities.id))
    .leftJoin(
      implementationStatements,
      and(
        eq(implementationStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(implementationStatements.projectId, id),
      ),
    )
    .orderBy(asc(pillars.sortOrder));

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
        ztLevel: row.ztLevel as ZtLevel,
        status: row.status,
      });
    }
  }

  const posture = [...grouped.values()]
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

  return { projectId: id, pillars: posture };
}

export async function getProjectPillarDetail(
  projectId: number,
  pillarId: number,
): Promise<ProjectPillarDetail | null> {
  const [project, pillar] = await Promise.all([
    db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true },
    }),
    db.query.pillars.findFirst({
      where: eq(pillars.id, pillarId),
    }),
  ]);

  if (!project || !pillar) return null;

  await ensureProjectCatalogue(projectId);

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
    })
    .from(capabilities)
    .innerJoin(measurableOutcomes, eq(measurableOutcomes.capabilityId, capabilities.id))
    .leftJoin(
      implementationStatements,
      and(
        eq(implementationStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(implementationStatements.projectId, projectId),
      ),
    )
    .where(eq(capabilities.pillarId, pillarId))
    .orderBy(asc(capabilities.code), asc(measurableOutcomes.code));

  const outcomes = rows.map((row) => ({
    id: row.outcomeId,
    code: row.outcomeCode,
    definition: row.definition,
    ztLevel: row.ztLevel as ZtLevel,
    capabilityCode: row.capabilityCode,
    capabilityName: row.capabilityName,
    status: row.status,
    statement: row.statement,
  }));

  const summary = summarizePillar(
    outcomes.map((outcome) => ({
      ztLevel: outcome.ztLevel,
      status: outcome.status,
    })),
  );

  return {
    projectId,
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
