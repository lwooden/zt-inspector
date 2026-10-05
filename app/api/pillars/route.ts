import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { capabilities, measurableOutcomes, pillars } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.query.pillars.findMany({
    orderBy: [asc(pillars.sortOrder)],
    with: {
      capabilities: {
        orderBy: [asc(capabilities.code)],
        with: {
          outcomes: {
            orderBy: [asc(measurableOutcomes.code)],
          },
        },
      },
    },
  });

  return NextResponse.json({ pillars: rows });
}
