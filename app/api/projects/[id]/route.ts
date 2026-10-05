import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { jsonError, noContent, readJson, validationError } from "@/lib/http";
import { getProject } from "@/lib/queries/projects";
import { idSchema, updateProjectSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Project not found", 404);

  const project = await getProject(idParsed.data);
  if (!project) return jsonError("Project not found", 404);
  return NextResponse.json(project);
}

export async function PATCH(request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Project not found", 404);
  const id = idParsed.data;

  const parsed = updateProjectSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const [updated] = await db
    .update(projects)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  if (!updated) return jsonError("Project not found", 404);
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Project not found", 404);

  const [deleted] = await db
    .delete(projects)
    .where(eq(projects.id, idParsed.data))
    .returning({ id: projects.id });
  if (!deleted) return jsonError("Project not found", 404);
  return noContent();
}
