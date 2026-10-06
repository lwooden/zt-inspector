import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  capabilities,
  measurableOutcomes,
  implementationStatements,
  projects,
} from "@/db/schema";
import { jsonError } from "@/lib/http";
import { ensureProjectCatalogue } from "@/lib/queries/projects";
import { idSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Project not found", 404);
  const id = idParsed.data;

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, id),
    columns: { id: true },
  });
  if (!project) return jsonError("Project not found", 404);

  await ensureProjectCatalogue(id);

  const statements = await db
    .select({
      id: implementationStatements.id,
      projectId: implementationStatements.projectId,
      measurableOutcomeId: implementationStatements.measurableOutcomeId,
      status: implementationStatements.status,
      statement: implementationStatements.statement,
      currentPercentage: implementationStatements.currentPercentage,
      targetPercentage: implementationStatements.targetPercentage,
      createdAt: implementationStatements.createdAt,
      updatedAt: implementationStatements.updatedAt,
      outcome: {
        id: measurableOutcomes.id,
        capabilityId: measurableOutcomes.capabilityId,
        code: measurableOutcomes.code,
        definition: measurableOutcomes.definition,
        ztLevel: measurableOutcomes.ztLevel,
      },
    })
    .from(implementationStatements)
    .innerJoin(
      measurableOutcomes,
      eq(implementationStatements.measurableOutcomeId, measurableOutcomes.id),
    )
    .innerJoin(capabilities, eq(measurableOutcomes.capabilityId, capabilities.id))
    .where(eq(implementationStatements.projectId, id))
    .orderBy(asc(capabilities.code), asc(measurableOutcomes.code));

  return NextResponse.json({ statements });
}
