import { NextResponse } from "next/server";
import { db } from "@/db";
import { measurableOutcomes } from "@/db/schema";
import { jsonError, pgErrorCode, readJson, validationError } from "@/lib/http";
import { ensureCatalogueForAllEnvironments } from "@/lib/queries/environments";
import { createMeasurableOutcomeSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = createMeasurableOutcomeSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const capability = await db.query.capabilities.findFirst({
    where: (table, { eq }) => eq(table.id, parsed.data.capabilityId),
  });
  if (!capability) return jsonError("Capability not found", 404);

  try {
    const [created] = await db.insert(measurableOutcomes).values(parsed.data).returning();
    await ensureCatalogueForAllEnvironments(created.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (pgErrorCode(error) === "23505") {
      return jsonError(
        "A measurable outcome with this code already exists in the capability",
        409,
      );
    }
    throw error;
  }
}
