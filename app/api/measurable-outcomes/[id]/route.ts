import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { implementationStatements, measurableOutcomes } from "@/db/schema";
import { jsonError, noContent, pgErrorCode, readJson, validationError } from "@/lib/http";
import { idSchema, updateMeasurableOutcomeSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Measurable outcome not found", 404);
  const id = idParsed.data;

  const parsed = updateMeasurableOutcomeSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const [updated] = await db
      .update(measurableOutcomes)
      .set(parsed.data)
      .where(eq(measurableOutcomes.id, id))
      .returning();
    if (!updated) return jsonError("Measurable outcome not found", 404);
    return NextResponse.json(updated);
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return jsonError("A measurable outcome with this code already exists in the capability", 409);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Measurable outcome not found", 404);
  const id = idParsed.data;

  const existing = await db.query.measurableOutcomes.findFirst({
    where: eq(measurableOutcomes.id, id),
  });
  if (!existing) return jsonError("Measurable outcome not found", 404);

  const statement = await db.query.implementationStatements.findFirst({
    where: eq(implementationStatements.measurableOutcomeId, id),
  });
  if (statement) {
    return jsonError("Measurable outcome still has implementation statements", 409);
  }

  try {
    await db.delete(measurableOutcomes).where(eq(measurableOutcomes.id, id));
  } catch (error) {
    if (pgErrorCode(error) === "23503") {
      return jsonError("Measurable outcome still has implementation statements", 409);
    }
    throw error;
  }

  return noContent();
}
