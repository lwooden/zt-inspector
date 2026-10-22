import { and, asc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  capabilities,
  implementationStatements,
  measurableOutcomes,
  type ImplementationStatus,
} from "@/db/schema";
import { jsonError } from "@/lib/http";
import { ensureEnvironmentCatalogue } from "@/lib/queries/environments";
import { getProject } from "@/lib/queries/projects";
import { idSchema } from "@/lib/validators";
import type { StatementSource } from "@/lib/types/projects";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Project not found", 404);

  const project = await getProject(idParsed.data);
  if (!project) return jsonError("Project not found", 404);

  await ensureEnvironmentCatalogue(project.environmentId);

  const projectStatements = alias(implementationStatements, "project_statements");
  const environmentStatements = alias(implementationStatements, "environment_statements");

  const statements = await db
    .select({
      id: sql<number>`coalesce(${projectStatements.id}, ${environmentStatements.id})`,
      projectId: sql<number | null>`${projectStatements.projectId}`,
      environmentId: sql<number | null>`coalesce(${projectStatements.environmentId}, ${environmentStatements.environmentId})`,
      measurableOutcomeId: measurableOutcomes.id,
      status: sql<ImplementationStatus | null>`coalesce(${projectStatements.status}, ${environmentStatements.status})`,
      statement: sql<string | null>`coalesce(${projectStatements.statement}, ${environmentStatements.statement})`,
      currentPercentage: sql<number>`coalesce(${projectStatements.currentPercentage}, ${environmentStatements.currentPercentage}, 0)`,
      targetPercentage: sql<number>`coalesce(${projectStatements.targetPercentage}, ${environmentStatements.targetPercentage}, 100)`,
      source: sql<StatementSource>`case when ${projectStatements.id} is not null then 'project' else 'environment' end`,
      outcome: {
        id: measurableOutcomes.id,
        capabilityId: measurableOutcomes.capabilityId,
        code: measurableOutcomes.code,
        definition: measurableOutcomes.definition,
        ztLevel: measurableOutcomes.ztLevel,
      },
    })
    .from(measurableOutcomes)
    .innerJoin(capabilities, eq(measurableOutcomes.capabilityId, capabilities.id))
    .leftJoin(
      projectStatements,
      and(
        eq(projectStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(projectStatements.projectId, project.id),
      ),
    )
    .leftJoin(
      environmentStatements,
      and(
        eq(environmentStatements.measurableOutcomeId, measurableOutcomes.id),
        eq(environmentStatements.environmentId, project.environmentId),
      ),
    )
    .orderBy(asc(capabilities.code), asc(measurableOutcomes.code));

  return NextResponse.json({ statements });
}
