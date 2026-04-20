/**
 * Upload client d’une image vers une URL publique (DB : `string[]` d’URLs).
 */
import {
  ACCEPTED_IMAGE_MIME_TYPE_SET,
} from "@/lib/apartment-image-constraints"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"

type UploadApiSuccess = {
  url: string
  sizeBytes: number
}

type UploadSourceApiSuccess = {
  sourcePath: string
  token: string
}

type UploadApiFailure = {
  error?: string
}

/**
 * Envoie l’image brute vers le pipeline serveur qui optimise puis stocke.
 */
export async function uploadImage(file: File): Promise<string> {
  const mimeType = file.type.toLowerCase()
  if (!ACCEPTED_IMAGE_MIME_TYPE_SET.has(mimeType)) {
    throw new Error(
      "Unsupported image format. Use JPG, PNG, WebP, HEIC, or HEIF.",
    )
  }

  const sourceResponse = await fetch("/api/admin/images/signed-upload-url", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileName: file.name }),
  })

  let sourceBody: UploadSourceApiSuccess | UploadApiFailure = {}
  try {
    sourceBody = (await sourceResponse.json()) as UploadSourceApiSuccess | UploadApiFailure
  } catch {
    // Keep generic message below when the API response is not JSON.
  }
  if (!sourceResponse.ok) {
    if (
      "error" in sourceBody &&
      typeof sourceBody.error === "string" &&
      sourceBody.error.trim()
    ) {
      throw new Error(sourceBody.error)
    }
    throw new Error("Image upload failed")
  }
  if (
    !("sourcePath" in sourceBody) ||
    typeof sourceBody.sourcePath !== "string" ||
    !sourceBody.sourcePath.trim() ||
    typeof sourceBody.token !== "string" ||
    !sourceBody.token.trim()
  ) {
    throw new Error("Image upload failed")
  }

  const supabase = getSupabaseBrowserClient()
  const { error: signedUploadError } = await supabase.storage
    .from("apartments")
    .uploadToSignedUrl(sourceBody.sourcePath, sourceBody.token, file)
  if (signedUploadError) {
    throw new Error(signedUploadError.message)
  }

  const response = await fetch("/api/admin/images", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sourcePath: sourceBody.sourcePath }),
  })
  let body: UploadApiSuccess | UploadApiFailure = {}
  try {
    body = (await response.json()) as UploadApiSuccess | UploadApiFailure
  } catch {
    // Keep generic message below when the API response is not JSON.
  }

  if (!response.ok) {
    if ("error" in body && typeof body.error === "string" && body.error.trim()) {
      throw new Error(body.error)
    }
    throw new Error("Image upload failed")
  }

  if (!("url" in body) || typeof body.url !== "string" || !body.url.trim()) {
    throw new Error("Image upload failed")
  }

  return body.url
}
