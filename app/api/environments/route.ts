import { NextResponse } from "next/server";
import { jsonError, pgErrorCode, readJson, validationError } from "@/lib/http";
import { createEnvironmentWithCatalogue, listEnvironments } from "@/lib/queries/environments";
import { createEnvironmentSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listEnvironments();
  return NextResponse.json({ environments: rows });
}

export async function POST(request: Request) {
  const parsed = createEnvironmentSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  try {
    const created = await createEnvironmentWithCatalogue(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return jsonError("An environment with this name already exists", 409);
    }
    throw error;
  }
}
