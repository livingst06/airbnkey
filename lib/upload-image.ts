/**
 * Upload client d’une image vers une URL publique (DB : `string[]` d’URLs).
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
 * Envoie l’image brute vers le pipeline serveur qui optimise puis stocke.
 */
export async function uploadImage(file: File): Promise<string> {
  const mimeType = file.type.toLowerCase()
  if (!ACCEPTED_IMAGE_MIME_TYPE_SET.has(mimeType)) {
    throw new Error(
      "Unsupported image format. Use JPG, PNG, WebP, HEIC, or HEIF.",
    )
  }

  const payload = new FormData()
  payload.append("file", file)

  const response = await fetch("/api/admin/images", {
    method: "POST",
    body: payload,
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
