import { NextResponse } from "next/server"

import { isCurrentUserAdmin } from "@/lib/admin-auth"
import {
  ACCEPTED_IMAGE_MIME_TYPE_SET,
} from "@/lib/apartment-image-constraints"
import { processImageForStorage } from "@/lib/server-image-pipeline"
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

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return jsonError(
      "Upload payload is too large or invalid. Please retry with fewer files at once.",
      413,
    )
  }
  const rawFile = formData.get("file")
  if (!(rawFile instanceof File)) {
    return jsonError("No image file was provided", 400)
  }

  const mimeType = rawFile.type.toLowerCase()
  if (!ACCEPTED_IMAGE_MIME_TYPE_SET.has(mimeType)) {
    return jsonError("Unsupported image format", 400)
  }

  try {
    const processed = await processImageForStorage(
      Buffer.from(await rawFile.arrayBuffer()),
    )
    const path = `apartments/${crypto.randomUUID()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from("apartments")
      .upload(path, processed.buffer, {
        contentType: processed.contentType,
        upsert: false,
      })

    if (uploadError) {
      const message =
        uploadError.message.includes("row-level security")
          ? "Storage upload blocked by policy. Configure SUPABASE_SERVICE_ROLE_KEY or adjust bucket policies."
          : uploadError.message
      return jsonError(message, 500)
    }

    const { data } = supabase.storage.from("apartments").getPublicUrl(path)
    return NextResponse.json({
      url: data.publicUrl,
      sizeBytes: processed.sizeBytes,
    })
  } catch {
    return jsonError(
      "Image optimization failed. Please try another image with less visual detail.",
      400,
    )
  }
}
