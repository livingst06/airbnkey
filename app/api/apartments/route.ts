import { NextResponse } from "next/server"

import { getApartmentsFresh } from "@/lib/apartments-db"

/** Raw read endpoint (monitoring/external tools), separate from Server Actions. */
export async function GET() {
  try {
    const apartments = await getApartmentsFresh()
    return NextResponse.json(apartments)
  } catch (e) {
    console.error("[api/apartments]", e)
    return NextResponse.json(
      { error: "Failed to load apartments" },
      { status: 500 },
    )
  }
}
