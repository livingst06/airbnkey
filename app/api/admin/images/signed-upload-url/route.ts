import { NextResponse } from "next/server"

import { isCurrentUserAdmin } from "@/lib/admin-auth"
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client"

export const runtime = "nodejs"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function sanitizeExtension(fileName: string | undefined): string {
  const raw = fileName?.trim().toLowerCase() ?? ""
  if (!raw.includes(".")) return "jpg"
  const ext = raw.slice(raw.lastIndexOf(".") + 1)
  if (!ext) return "jpg"
  if (!/^[a-z0-9]{1,10}$/.test(ext)) return "jpg"
  return ext
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return jsonError("Not authorized", 403)
  }

  const supabase = createSupabaseAdminClient()
  if (!supabase) {
    return jsonError(
      "Image upload is not configured. Missing SUPABASE_SERVICE_ROLE_KEY.",
      500,
    )
  }

  let body: { fileName?: string } = {}
  try {
    body = (await request.json()) as { fileName?: string }
  } catch {
    return jsonError("Invalid request payload.", 400)
  }

  const ext = sanitizeExtension(body.fileName)
  const sourcePath = `apartments/raw/${crypto.randomUUID()}.${ext}`

  const { data, error } = await supabase.storage
    .from("apartments")
    .createSignedUploadUrl(sourcePath)

  if (error || !data) {
    return jsonError(error?.message ?? "Unable to create upload URL.", 500)
  }

  return NextResponse.json({
    sourcePath,
    token: data.token,
  })
}
