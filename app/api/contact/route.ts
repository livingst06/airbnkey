import { NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

import { getCurrentUserEmail } from "@/lib/admin-auth"

const contactPayloadSchema = z.object({
  message: z
    .string()
    .trim()
    .min(5, "Message trop court")
    .max(2000, "Message trop long"),
})

export async function POST(request: Request) {
  const userEmail = await getCurrentUserEmail()
  if (!userEmail) {
    return NextResponse.json(
      { success: false, error: "Please sign in to send a message." },
      { status: 401 },
    )
  }

  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Email service is not configured." },
      { status: 500 },
    )
  }

  const recipient = process.env.EMAIL_CEO?.trim()
  if (!recipient) {
    return NextResponse.json(
      { success: false, error: "Contact recipient is not configured." },
      { status: 500 },
    )
  }

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

  const resend = new Resend(apiKey)
  try {
    const { error } = await resend.emails.send({
      from: "Airbnkey Contact <onboarding@resend.dev>",
      to: recipient,
      subject: `New contact message from ${userEmail}`,
      replyTo: userEmail,
      text: [
        `From: ${userEmail}`,
        "",
        "Message:",
        parsed.data.message,
      ].join("\n"),
    })
    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Email delivery failed: ${error.message}`,
        },
        { status: 502 },
      )
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Email delivery failed. Please try again later." },
      { status: 502 },
    )
  }

  return NextResponse.json({
    success: true,
    accepted: true,
    message: "Message reçu",
  })
}
