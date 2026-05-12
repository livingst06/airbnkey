import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

import { isCurrentUserAdmin } from "@/lib/admin-auth"
import {
  ACCEPTED_IMAGE_MIME_TYPE_SET,
} from "@/lib/apartment-image-constraints"
import { processImageForStorage } from "@/lib/server-image-pipeline"
import { tryCreateSupabaseAdminClient } from "@/lib/supabase/admin-client"

export const runtime = "nodejs"

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function mapUploadErrorMessage(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes("signature verification failed")) {
    return (
      "Supabase a refusé la clé serveur : signature JWT invalide. Dans Vercel, collez SUPABASE_SERVICE_ROLE_KEY depuis Settings > API > service_role secret (pas la clé anon), pour le même projet que NEXT_PUBLIC_SUPABASE_URL ; sans guillemets dans le champ secret."
    )
  }
  return raw
}

async function processAndStoreBuffer(
  supabase: SupabaseClient,
  sourceBuffer: Buffer,
) {
  const processed = await processImageForStorage(sourceBuffer)
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
    throw new Error(message)
  }

  const { data } = supabase.storage.from("apartments").getPublicUrl(path)
  return {
    url: data.publicUrl,
    sizeBytes: processed.sizeBytes,
  }
}

export async function POST(request: Request) {
  if (!(await isCurrentUserAdmin())) {
    return jsonError("Not authorized", 403)
  }

  const adminResult = tryCreateSupabaseAdminClient()
  if (!adminResult.ok) {
    return jsonError(adminResult.error, 500)
  }
  const supabase = adminResult.client

  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""

    // Optional: JSON `{ sourcePath }` if a blob is already in the bucket at that path.
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { sourcePath?: string }
      const sourcePath = body.sourcePath?.trim()
      if (!sourcePath) {
        return jsonError("Missing source path for image processing.", 400)
      }

      const { data: sourceBlob, error: downloadError } = await supabase.storage
        .from("apartments")
        .download(sourcePath)
      if (downloadError || !sourceBlob) {
        return jsonError("Unable to read uploaded source image.", 400)
      }

      const result = await processAndStoreBuffer(
        supabase,
        Buffer.from(await sourceBlob.arrayBuffer()),
      )

      await supabase.storage.from("apartments").remove([sourcePath])
      return NextResponse.json(result)
    }

    // Primary path: multipart file from browser (optimize + upload in one hop).
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

    const result = await processAndStoreBuffer(
      supabase,
      Buffer.from(await rawFile.arrayBuffer()),
    )
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message.trim()) {
      const raw = error.message
      const msg = mapUploadErrorMessage(raw)
      const isServerMisconfig =
        raw.toLowerCase().includes("signature verification") || msg !== raw
      return jsonError(msg, isServerMisconfig ? 503 : 400)
    }
    return jsonError(
      "Image optimization failed. Please try another image with less visual detail.",
      400,
    )
  }
}
