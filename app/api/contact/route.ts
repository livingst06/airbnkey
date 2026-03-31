import { NextResponse } from "next/server"
import { z } from "zod"

const contactPayloadSchema = z.object({
  message: z
    .string()
    .trim()
    .min(5, "Message trop court")
    .max(2000, "Message trop long"),
})

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = contactPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Message invalide" },
      { status: 400 },
    )
  }

  return NextResponse.json({
    success: true,
    accepted: true,
    message: "Message reçu",
  })
}
