import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getEnvironmentPillarDetail } from "@/lib/queries/environments";
import { idSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; pillarId: string }> };

export async function GET(_request: Request, context: Context) {
  const { id: rawId, pillarId: rawPillarId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  const pillarParsed = idSchema.safeParse(rawPillarId);
  if (!idParsed.success) return jsonError("Environment not found", 404);
  if (!pillarParsed.success) return jsonError("Pillar not found", 404);

  const detail = await getEnvironmentPillarDetail(idParsed.data, pillarParsed.data);
  if (!detail) return jsonError("Environment or pillar not found", 404);
  return NextResponse.json(detail);
}
