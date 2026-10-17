import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { environments, implementationStatements, measurableOutcomes } from "@/db/schema";
import { jsonError, readJson, validationError } from "@/lib/http";
import { normalizeStatementStatus } from "@/lib/posture";
import { idSchema, upsertStatementSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; outcomeId: string }> };

export async function PUT(request: Request, context: Context) {
  const { id: rawId, outcomeId: rawOutcomeId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  const outcomeParsed = idSchema.safeParse(rawOutcomeId);
  if (!idParsed.success) return jsonError("Environment not found", 404);
  if (!outcomeParsed.success) return jsonError("Measurable outcome not found", 404);

  const parsed = upsertStatementSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const [environment, outcome] = await Promise.all([
    db.query.environments.findFirst({
      where: eq(environments.id, idParsed.data),
      columns: { id: true },
    }),
    db.query.measurableOutcomes.findFirst({
      where: eq(measurableOutcomes.id, outcomeParsed.data),
      columns: { id: true },
    }),
  ]);
  if (!environment) return jsonError("Environment not found", 404);
  if (!outcome) return jsonError("Measurable outcome not found", 404);

  const status = normalizeStatementStatus(
    parsed.data.status,
    parsed.data.currentPercentage,
    parsed.data.targetPercentage,
  );

  const [saved] = await db
    .insert(implementationStatements)
    .values({
      environmentId: idParsed.data,
      measurableOutcomeId: outcomeParsed.data,
      status,
      statement: parsed.data.statement,
      currentPercentage: parsed.data.currentPercentage,
      targetPercentage: parsed.data.targetPercentage,
    })
    .onConflictDoUpdate({
      target: [
        implementationStatements.environmentId,
        implementationStatements.measurableOutcomeId,
      ],
      set: {
        status,
        statement: parsed.data.statement,
        currentPercentage: parsed.data.currentPercentage,
        targetPercentage: parsed.data.targetPercentage,
        updatedAt: new Date(),
      },
    })
    .returning();

  return NextResponse.json(saved);
}
