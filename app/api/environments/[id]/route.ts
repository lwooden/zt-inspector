import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { environments } from "@/db/schema";
import { jsonError, noContent, pgErrorCode, readJson, validationError } from "@/lib/http";
import { countProjectsInEnvironment, getEnvironment } from "@/lib/queries/environments";
import { idSchema, updateEnvironmentSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Environment not found", 404);

  const environment = await getEnvironment(idParsed.data);
  if (!environment) return jsonError("Environment not found", 404);
  return NextResponse.json(environment);
}

export async function PATCH(request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Environment not found", 404);

  const parsed = updateEnvironmentSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const [updated] = await db
      .update(environments)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(environments.id, idParsed.data))
      .returning();
    if (!updated) return jsonError("Environment not found", 404);
    return NextResponse.json(updated);
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return jsonError("An environment with this name already exists", 409);
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Environment not found", 404);

  const environment = await getEnvironment(idParsed.data);
  if (!environment) return jsonError("Environment not found", 404);

  const projectCount = await countProjectsInEnvironment(idParsed.data);
  if (projectCount > 0) {
    return jsonError("Environment is still referenced by projects", 409);
  }

  try {
    const [deleted] = await db
      .delete(environments)
      .where(eq(environments.id, idParsed.data))
      .returning({ id: environments.id });
    if (!deleted) return jsonError("Environment not found", 404);
    return noContent();
  } catch (error) {
    if (pgErrorCode(error) === "23503") {
      return jsonError("Environment is still referenced by projects", 409);
    }
    throw error;
  }
}
