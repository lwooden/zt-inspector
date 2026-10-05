import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { measurableOutcomes, implementationStatements, projects } from "@/db/schema";
import { jsonError, noContent, readJson, validationError } from "@/lib/http";
import { idSchema, upsertStatementSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; outcomeId: string }> };

async function loadPair(projectId: number, outcomeId: number) {
  const [project, outcome] = await Promise.all([
    db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      columns: { id: true },
    }),
    db.query.measurableOutcomes.findFirst({
      where: eq(measurableOutcomes.id, outcomeId),
      columns: { id: true },
    }),
  ]);
  return { project, outcome };
}

export async function PUT(request: Request, context: Context) {
  const { id: rawId, outcomeId: rawOutcomeId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  const outcomeParsed = idSchema.safeParse(rawOutcomeId);
  if (!idParsed.success) return jsonError("Project not found", 404);
  if (!outcomeParsed.success) return jsonError("Measurable outcome not found", 404);

  const parsed = upsertStatementSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const { project, outcome } = await loadPair(idParsed.data, outcomeParsed.data);
  if (!project) return jsonError("Project not found", 404);
  if (!outcome) return jsonError("Measurable outcome not found", 404);

  const [saved] = await db
    .insert(implementationStatements)
    .values({
      projectId: idParsed.data,
      measurableOutcomeId: outcomeParsed.data,
      status: parsed.data.status,
      statement: parsed.data.statement,
    })
    .onConflictDoUpdate({
      target: [
        implementationStatements.projectId,
        implementationStatements.measurableOutcomeId,
      ],
      set: {
        status: parsed.data.status,
        statement: parsed.data.statement,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json(saved);
}

export async function DELETE(_request: Request, context: Context) {
  const { id: rawId, outcomeId: rawOutcomeId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  const outcomeParsed = idSchema.safeParse(rawOutcomeId);
  if (!idParsed.success) return jsonError("Project not found", 404);
  if (!outcomeParsed.success) return jsonError("Measurable outcome not found", 404);

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, idParsed.data),
    columns: { id: true },
  });
  if (!project) return jsonError("Project not found", 404);

  const [deleted] = await db
    .delete(implementationStatements)
    .where(
      and(
        eq(implementationStatements.projectId, idParsed.data),
        eq(implementationStatements.measurableOutcomeId, outcomeParsed.data),
      ),
    )
    .returning({ id: implementationStatements.id });

  if (!deleted) return jsonError("Implementation statement not found", 404);
  return noContent();
}
