import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getProjectPosture } from "@/lib/queries/projects";
import { idSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Project not found", 404);

  const posture = await getProjectPosture(idParsed.data);
  if (!posture) return jsonError("Project not found", 404);
  return NextResponse.json(posture);
}
