import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { ensureEnvironmentCatalogue } from "@/lib/queries/environments";
import { getProject } from "@/lib/queries/projects";
import { idSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Project not found", 404);

  const project = await getProject(idParsed.data);
  if (!project) return jsonError("Project not found", 404);

  const inserted = await ensureEnvironmentCatalogue(project.environmentId);
  return NextResponse.json({
    projectId: project.id,
    environmentId: project.environmentId,
    inserted,
  });
}
