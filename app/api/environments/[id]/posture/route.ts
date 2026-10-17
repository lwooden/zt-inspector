import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getEnvironmentPosture } from "@/lib/queries/environments";
import { idSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const { id: rawId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  if (!idParsed.success) return jsonError("Environment not found", 404);

  const posture = await getEnvironmentPosture(idParsed.data);
  if (!posture) return jsonError("Environment not found", 404);
  return NextResponse.json(posture);
}
