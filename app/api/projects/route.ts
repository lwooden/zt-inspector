import { NextResponse } from "next/server";
import { jsonError, readJson, validationError } from "@/lib/http";
import { createProject, listProjects } from "@/lib/queries/projects";
import { createProjectSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listProjects();
  return NextResponse.json({ projects: rows });
}

export async function POST(request: Request) {
  const parsed = createProjectSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const created = await createProject(parsed.data);
  if (!created) return jsonError("Environment not found", 404);
  return NextResponse.json(created, { status: 201 });
}
