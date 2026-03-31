import { NextResponse } from "next/server"

import { getApartmentsFresh } from "@/lib/apartments-db"

export async function GET() {
  try {
    const apartments = await getApartmentsFresh()
    return NextResponse.json(apartments)
  } catch (e) {
    console.error("[api/apartments]", e)
    return NextResponse.json(
      { error: "Impossible de charger les appartements" },
      { status: 500 },
    )
  }
}
