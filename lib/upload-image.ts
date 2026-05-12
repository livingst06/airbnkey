/**
 * Upload client d’une image vers une URL publique (DB : `string[]` d’URLs).
 * Utilise uniquement POST multipart vers `/api/admin/images` (Sharp côté serveur + upload service role).
 * L’ancien flux « signed upload URL » vers Supabase était sujet aux 403 / « signature verification failed » en prod.
 */

import {
  ACCEPTED_IMAGE_MIME_TYPE_SET,
} from "@/lib/apartment-image-constraints"

type UploadApiSuccess = {
  url: string
  sizeBytes: number
}

type UploadApiFailure = {
  error?: string
}

/**
 * Envoie l’image vers le pipeline serveur (multipart) qui optimise puis stocke sur Supabase.
 */
export async function uploadImage(file: File): Promise<string> {
  const mimeType = file.type.toLowerCase()
  if (!ACCEPTED_IMAGE_MIME_TYPE_SET.has(mimeType)) {
    throw new Error(
      "Unsupported image format. Use JPG, PNG, WebP, HEIC, or HEIF.",
    )
  }

  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/admin/images", {
    method: "POST",
    body: formData,
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
