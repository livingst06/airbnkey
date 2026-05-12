import { NextResponse } from "next/server"

import { isCurrentUserAdmin } from "@/lib/admin-auth"
import { createRawApartmentUploadPath } from "@/lib/apartment-image-upload-path"
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client"

export const runtime = "nodejs"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
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

  const sourcePath = createRawApartmentUploadPath(body.fileName)

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
