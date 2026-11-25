import { and, asc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  capabilities,
  environments,
  measurableOutcomes,
  implementationStatements,
  pillars,
  projects,
  type ImplementationStatus,
} from "@/db/schema";
import { outcomeCompletion, summarizePillar } from "@/lib/posture";
import {
  ensureEnvironmentCatalogue,
  postureFromRows,
} from "@/lib/queries/environments";
import type { Project, ProjectPillarDetail, ProjectPosture, StatementSource } from "@/lib/types/projects";
import {
  applyVerificationAttest,
  applyVerificationClear,
  verificationColumns,
  type StatementVerification,
  type VerificationRole,
} from "@/lib/verification";

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
  environmentId: number;
};

const projectColumns = {
  id: projects.id,
  environmentId: projects.environmentId,
  environmentName: environments.name,
  name: projects.name,
  governmentItpm: projects.governmentItpm,
  divisionOwner: projects.divisionOwner,
  createdAt: projects.createdAt,
  updatedAt: projects.updatedAt,
};

export async function listProjects(): Promise<Project[]> {
  return db
    .select(projectColumns)
    .from(projects)
    .innerJoin(environments, eq(projects.environmentId, environments.id))
    .orderBy(asc(projects.name));
}

export async function getProject(id: number): Promise<Project | null> {
  const [project] = await db
    .select(projectColumns)
    .from(projects)
    .innerJoin(environments, eq(projects.environmentId, environments.id))
    .where(eq(projects.id, id))
    .limit(1);
  return project ?? null;
}

export async function createProject(input: CreateProjectInput): Promise<Project | null> {
  const environment = await db.query.environments.findFirst({
    where: eq(environments.id, input.environmentId),
    columns: { id: true },
  });
  if (!environment) return null;

  await ensureEnvironmentCatalogue(input.environmentId);

  const [created] = await db.insert(projects).values(input).returning({ id: projects.id });
  return getProject(created.id);
}

export async function getProjectPosture(id: number): Promise<ProjectPosture | null> {
  const project = await getProject(id);
  if (!project) return null;

  await ensureEnvironmentCatalogue(project.environmentId);

  const projectStatements = alias(implementationStatements, "project_statements");
  const environmentStatements = alias(implementationStatements, "environment_statements");

  const rows = await db
    .select({
      pillarId: pillars.id,
      code: pillars.code,
      name: pillars.name,
      sortOrder: pillars.sortOrder,
      outcomeId: measurableOutcomes.id,
      ztLevel: measurableOutcomes.ztLevel,
      status: sql<ImplementationStatus | null>`coalesce(${projectStatements.status}, ${environmentStatements.status})`,
      currentPercentage: sql<number | null>`coalesce(${projectStatements.currentPercentage}, ${environmentStatements.currentPercentage})`,
      targetPercentage: sql<number | null>`coalesce(${projectStatements.targetPercentage}, ${environmentStatements.targetPercentage})`,
    })
    .from(pillars)
    .leftJoin(capabilities, eq(capabilities.pillarId, pillars.id))
    .leftJoin(measurableOutcomes, eq(measurableOutcomes.capabilityId, capabilities.id))
    .leftJoin(
      projectStatements,
      and(
        eq(projectStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(projectStatements.projectId, id),
      ),
    )
    .leftJoin(
      environmentStatements,
      and(
        eq(environmentStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(environmentStatements.environmentId, project.environmentId),
      ),
    )
    .orderBy(asc(pillars.sortOrder));

  return { projectId: id, pillars: postureFromRows(rows) };
}

export async function getProjectPillarDetail(
  projectId: number,
  pillarId: number,
): Promise<ProjectPillarDetail | null> {
  const [project, pillar] = await Promise.all([
    getProject(projectId),
    db.query.pillars.findFirst({
      where: eq(pillars.id, pillarId),
    }),
  ]);

  if (!project || !pillar) return null;

  await ensureEnvironmentCatalogue(project.environmentId);

  const projectStatements = alias(implementationStatements, "project_statements");
  const environmentStatements = alias(implementationStatements, "environment_statements");

  const rows = await db
    .select({
      outcomeId: measurableOutcomes.id,
      outcomeCode: measurableOutcomes.code,
      definition: measurableOutcomes.definition,
      ztLevel: measurableOutcomes.ztLevel,
      capabilityCode: capabilities.code,
      capabilityName: capabilities.name,
      status: sql<ImplementationStatus | null>`coalesce(${projectStatements.status}, ${environmentStatements.status})`,
      statement: sql<string | null>`coalesce(${projectStatements.statement}, ${environmentStatements.statement})`,
      gap: sql<string | null>`coalesce(${projectStatements.gap}, ${environmentStatements.gap})`,
      risk: sql<string | null>`coalesce(${projectStatements.risk}, ${environmentStatements.risk})`,
      currentPercentage: sql<number | null>`coalesce(${projectStatements.currentPercentage}, ${environmentStatements.currentPercentage})`,
      targetPercentage: sql<number | null>`coalesce(${projectStatements.targetPercentage}, ${environmentStatements.targetPercentage})`,
      targetImplementationDate: sql<string | null>`coalesce(${projectStatements.targetImplementationDate}, ${environmentStatements.targetImplementationDate})`,
      verifiedByProjectManagerAt: sql<Date | string | null>`case when ${projectStatements.id} is not null then ${projectStatements.verifiedByProjectManagerAt} else ${environmentStatements.verifiedByProjectManagerAt} end`,
      verifiedByProductManagerAt: sql<Date | string | null>`case when ${projectStatements.id} is not null then ${projectStatements.verifiedByProductManagerAt} else ${environmentStatements.verifiedByProductManagerAt} end`,
      verifiedByZtLeadAt: sql<Date | string | null>`case when ${projectStatements.id} is not null then ${projectStatements.verifiedByZtLeadAt} else ${environmentStatements.verifiedByZtLeadAt} end`,
      updatedAt: sql<Date | string | null>`coalesce(${projectStatements.updatedAt}, ${environmentStatements.updatedAt})`,
      source: sql<StatementSource>`case when ${projectStatements.id} is not null then 'project' else 'environment' end`,
    })
    .from(capabilities)
    .innerJoin(measurableOutcomes, eq(measurableOutcomes.capabilityId, capabilities.id))
    .leftJoin(
      projectStatements,
      and(
        eq(projectStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(projectStatements.projectId, projectId),
      ),
    )
    .leftJoin(
      environmentStatements,
      and(
        eq(environmentStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(environmentStatements.environmentId, project.environmentId),
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
    gap: row.gap,
    risk: row.risk,
    currentPercentage: row.currentPercentage ?? 0,
    targetPercentage: row.targetPercentage ?? 100,
    targetImplementationDate: row.targetImplementationDate,
    verification: {
      projectManagerAt: row.verifiedByProjectManagerAt,
      productManagerAt: row.verifiedByProductManagerAt,
      ztLeadAt: row.verifiedByZtLeadAt,
    },
    updatedAt: row.updatedAt,
    source: row.source,
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

export type CapabilityProgressStatement = {
  outcomeId: number;
  outcomeCode: string;
  capabilityCode: string;
  capabilityName: string;
  progress: number;
};

export type PillarCapabilityProgress = {
  pillarId: number;
  pillarName: string;
  statements: CapabilityProgressStatement[];
};

export type ProjectCapabilityProgress = {
  projectId: number;
  pillars: PillarCapabilityProgress[];
};

export async function getProjectCapabilityProgress(
  projectId: number,
): Promise<ProjectCapabilityProgress | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  await ensureEnvironmentCatalogue(project.environmentId);

  const projectStatements = alias(implementationStatements, "project_statements");
  const environmentStatements = alias(implementationStatements, "environment_statements");

  const rows = await db
    .select({
      pillarId: pillars.id,
      pillarName: pillars.name,
      sortOrder: pillars.sortOrder,
      outcomeId: measurableOutcomes.id,
      outcomeCode: measurableOutcomes.code,
      capabilityCode: capabilities.code,
      capabilityName: capabilities.name,
      status: sql<ImplementationStatus | null>`coalesce(${projectStatements.status}, ${environmentStatements.status})`,
      currentPercentage: sql<number | null>`coalesce(${projectStatements.currentPercentage}, ${environmentStatements.currentPercentage})`,
      targetPercentage: sql<number | null>`coalesce(${projectStatements.targetPercentage}, ${environmentStatements.targetPercentage})`,
    })
    .from(pillars)
    .leftJoin(capabilities, eq(capabilities.pillarId, pillars.id))
    .leftJoin(measurableOutcomes, eq(measurableOutcomes.capabilityId, capabilities.id))
    .leftJoin(
      projectStatements,
      and(
        eq(projectStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(projectStatements.projectId, projectId),
      ),
    )
    .leftJoin(
      environmentStatements,
      and(
        eq(environmentStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(environmentStatements.environmentId, project.environmentId),
      ),
    )
    .orderBy(asc(pillars.sortOrder), asc(capabilities.code), asc(measurableOutcomes.code));

  const pillarsById = new Map<number, PillarCapabilityProgress>();

  for (const row of rows) {
    let pillar = pillarsById.get(row.pillarId);
    if (!pillar) {
      pillar = { pillarId: row.pillarId, pillarName: row.pillarName, statements: [] };
      pillarsById.set(row.pillarId, pillar);
    }
    if (row.outcomeId == null || row.outcomeCode == null || row.capabilityCode == null || row.capabilityName == null) {
      continue;
    }
    const completion = outcomeCompletion({
      ztLevel: "basic",
      status: row.status,
      currentPercentage: row.currentPercentage ?? 0,
      targetPercentage: row.targetPercentage ?? 100,
    });
    if (completion == null) continue;

    pillar.statements.push({
      outcomeId: row.outcomeId,
      outcomeCode: row.outcomeCode,
      capabilityCode: row.capabilityCode,
      capabilityName: row.capabilityName,
      progress: completion * 100,
    });
  }

  return { projectId, pillars: [...pillarsById.values()] };
}

type EffectiveStatementRow = {
  status: ImplementationStatus | null;
  statement: string | null;
  gap: string | null;
  risk: string | null;
  currentPercentage: number;
  targetPercentage: number;
  targetImplementationDate: string | null;
  verification: StatementVerification;
};

async function getProjectEffectiveStatement(
  projectId: number,
  measurableOutcomeId: number,
): Promise<EffectiveStatementRow | null> {
  const project = await getProject(projectId);
  if (!project) return null;

  const projectStatements = alias(implementationStatements, "project_statements");
  const environmentStatements = alias(implementationStatements, "environment_statements");

  const [row] = await db
    .select({
      status: sql<ImplementationStatus | null>`coalesce(${projectStatements.status}, ${environmentStatements.status})`,
      statement: sql<string | null>`coalesce(${projectStatements.statement}, ${environmentStatements.statement})`,
      gap: sql<string | null>`coalesce(${projectStatements.gap}, ${environmentStatements.gap})`,
      risk: sql<string | null>`coalesce(${projectStatements.risk}, ${environmentStatements.risk})`,
      currentPercentage: sql<number | null>`coalesce(${projectStatements.currentPercentage}, ${environmentStatements.currentPercentage})`,
      targetPercentage: sql<number | null>`coalesce(${projectStatements.targetPercentage}, ${environmentStatements.targetPercentage})`,
      targetImplementationDate: sql<string | null>`coalesce(${projectStatements.targetImplementationDate}, ${environmentStatements.targetImplementationDate})`,
      verifiedByProjectManagerAt: sql<Date | string | null>`case when ${projectStatements.id} is not null then ${projectStatements.verifiedByProjectManagerAt} else ${environmentStatements.verifiedByProjectManagerAt} end`,
      verifiedByProductManagerAt: sql<Date | string | null>`case when ${projectStatements.id} is not null then ${projectStatements.verifiedByProductManagerAt} else ${environmentStatements.verifiedByProductManagerAt} end`,
      verifiedByZtLeadAt: sql<Date | string | null>`case when ${projectStatements.id} is not null then ${projectStatements.verifiedByZtLeadAt} else ${environmentStatements.verifiedByZtLeadAt} end`,
    })
    .from(measurableOutcomes)
    .leftJoin(
      projectStatements,
      and(
        eq(projectStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(projectStatements.projectId, projectId),
      ),
    )
    .leftJoin(
      environmentStatements,
      and(
        eq(environmentStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(environmentStatements.environmentId, project.environmentId),
      ),
    )
    .where(eq(measurableOutcomes.id, measurableOutcomeId))
    .limit(1);

  if (!row || row.status == null) return null;

  return {
    status: row.status,
    statement: row.statement,
    gap: row.gap,
    risk: row.risk,
    currentPercentage: row.currentPercentage ?? 0,
    targetPercentage: row.targetPercentage ?? 100,
    targetImplementationDate: row.targetImplementationDate,
    verification: {
      projectManagerAt: row.verifiedByProjectManagerAt,
      productManagerAt: row.verifiedByProductManagerAt,
      ztLeadAt: row.verifiedByZtLeadAt,
    },
  };
}

export async function verifyProjectStatement(
  projectId: number,
  measurableOutcomeId: number,
  role: VerificationRole,
) {
  const effective = await getProjectEffectiveStatement(projectId, measurableOutcomeId);
  if (!effective) return { ok: false as const, error: "not_found" as const };
  if (effective.status !== "implemented") {
    return { ok: false as const, error: "not_implemented" as const };
  }

  const now = new Date();
  const applied = applyVerificationAttest(effective.verification, role, now);
  if (!applied.ok) return { ok: false as const, error: applied.error };

  const verification = verificationColumns(applied.verification);
  const [saved] = await db
    .insert(implementationStatements)
    .values({
      projectId,
      measurableOutcomeId,
      status: effective.status,
      statement: effective.statement,
      gap: effective.gap,
      risk: effective.risk,
      currentPercentage: effective.currentPercentage,
      targetPercentage: effective.targetPercentage,
      targetImplementationDate: effective.targetImplementationDate,
      ...verification,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        implementationStatements.projectId,
        implementationStatements.measurableOutcomeId,
      ],
      set: {
        ...verification,
        updatedAt: now,
      },
    })
    .returning();

  return { ok: true as const, statement: saved };
}

export async function unverifyProjectStatement(
  projectId: number,
  measurableOutcomeId: number,
  role: VerificationRole,
) {
  const effective = await getProjectEffectiveStatement(projectId, measurableOutcomeId);
  if (!effective) return { ok: false as const, error: "not_found" as const };

  const applied = applyVerificationClear(effective.verification, role);
  if (!applied.ok) return { ok: false as const, error: applied.error };

  const now = new Date();
  const verification = verificationColumns(applied.verification);
  const [saved] = await db
    .insert(implementationStatements)
    .values({
      projectId,
      measurableOutcomeId,
      status: effective.status ?? "not_started",
      statement: effective.statement,
      gap: effective.gap,
      risk: effective.risk,
      currentPercentage: effective.currentPercentage,
      targetPercentage: effective.targetPercentage,
      targetImplementationDate: effective.targetImplementationDate,
      ...verification,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        implementationStatements.projectId,
        implementationStatements.measurableOutcomeId,
      ],
      set: {
        ...verification,
        updatedAt: now,
      },
    })
    .returning();

  return { ok: true as const, statement: saved };
}
