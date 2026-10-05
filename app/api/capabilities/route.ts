import { NextResponse } from "next/server";
import { db } from "@/db";
import { capabilities } from "@/db/schema";
import { jsonError, pgErrorCode, readJson, validationError } from "@/lib/http";
import { createCapabilitySchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = createCapabilitySchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const pillar = await db.query.pillars.findFirst({
    where: (table, { eq }) => eq(table.id, parsed.data.pillarId),
  });
  if (!pillar) return jsonError("Pillar not found", 404);

  try {
    const [created] = await db.insert(capabilities).values(parsed.data).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return jsonError("A capability with this code already exists", 409);
    }
    throw error;
  }
}
