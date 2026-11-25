import { NextResponse } from "next/server";
import { jsonError, readJson, validationError } from "@/lib/http";
import {
  unverifyProjectStatement,
  verifyProjectStatement,
} from "@/lib/queries/projects";
import { idSchema, verifyRoleBodySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; outcomeId: string }> };

export async function POST(request: Request, context: Context) {
  const { id: rawId, outcomeId: rawOutcomeId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  const outcomeParsed = idSchema.safeParse(rawOutcomeId);
  if (!idParsed.success) return jsonError("Project not found", 404);
  if (!outcomeParsed.success) return jsonError("Measurable outcome not found", 404);

  const body = verifyRoleBodySchema.safeParse(await readJson(request));
  if (!body.success) return validationError(body.error);

  const result = await verifyProjectStatement(
    idParsed.data,
    outcomeParsed.data,
    body.data.role,
  );
  if (!result.ok) {
    if (result.error === "not_found") {
      return jsonError("Implementation statement not found", 404);
    }
    if (result.error === "not_implemented") {
      return jsonError("Statement must be implemented to verify", 400);
    }
    if (result.error === "out_of_order") {
      return jsonError("Verification roles must be completed in order", 400);
    }
    if (result.error === "already_verified") {
      return jsonError("Role is already verified", 400);
    }
    return jsonError("Failed to verify statement", 400);
  }
  return NextResponse.json(result.statement);
}

export async function DELETE(request: Request, context: Context) {
  const { id: rawId, outcomeId: rawOutcomeId } = await context.params;
  const idParsed = idSchema.safeParse(rawId);
  const outcomeParsed = idSchema.safeParse(rawOutcomeId);
  if (!idParsed.success) return jsonError("Project not found", 404);
  if (!outcomeParsed.success) return jsonError("Measurable outcome not found", 404);

  const body = verifyRoleBodySchema.safeParse(await readJson(request));
  if (!body.success) return validationError(body.error);

  const result = await unverifyProjectStatement(
    idParsed.data,
    outcomeParsed.data,
    body.data.role,
  );
  if (!result.ok) {
    if (result.error === "not_found") {
      return jsonError("Implementation statement not found", 404);
    }
    if (result.error === "not_verified") {
      return jsonError("Role is not verified", 400);
    }
    return jsonError("Failed to clear verification", 400);
  }
  return NextResponse.json(result.statement);
}
