import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { capabilities } from "@/db/schema";
import { jsonError, noContent, pgErrorCode, readJson, validationError } from "@/lib/http";
import { idSchema, updateCapabilitySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Capability not found", 404);
  const id = idParsed.data;

  const parsed = updateCapabilitySchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const [updated] = await db
      .update(capabilities)
      .set(parsed.data)
      .where(eq(capabilities.id, id))
      .returning();
    if (!updated) return jsonError("Capability not found", 404);
    return NextResponse.json(updated);
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return jsonError("A capability with this code already exists", 409);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Capability not found", 404);
  const id = idParsed.data;

  const existing = await db.query.capabilities.findFirst({
    where: eq(capabilities.id, id),
    with: { outcomes: { limit: 1 } },
  });
  if (!existing) return jsonError("Capability not found", 404);
  if (existing.outcomes.length > 0) {
    return jsonError("Capability still has measurable outcomes", 409);
  }

  try {
    await db.delete(capabilities).where(eq(capabilities.id, id));
  } catch (error) {
    if (pgErrorCode(error) === "23503") {
      return jsonError("Capability still has measurable outcomes", 409);
    }
    throw error;
  }

  return noContent();
}
