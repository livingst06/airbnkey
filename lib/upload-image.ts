/**
 * Upload client d’une image vers une URL publique (DB : `string[]` d’URLs).
 */
import {
  blobToDataUrl,
  compressImageFileToBlob,
} from "@/lib/image-compress"
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"

const SUPABASE_UPLOAD_ERROR =
  "Upload image indisponible : configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY, ou utilisez NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK=dataurl."

function getUploadSupabaseClient() {
  try {
    return getSupabaseBrowserClient()
  } catch {
    throw new Error(SUPABASE_UPLOAD_ERROR)
  }
}

/**
 * Prépare l’image (compression) puis retourne une URL à persister.
 * - `NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK=dataurl` : data URL (legacy / hors-ligne).
 * - Sinon : upload vers Supabase Storage (bucket `apartments`).
 */
export async function uploadImage(file: File): Promise<string> {
  const blob = await compressImageFileToBlob(file)
  if (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK === "dataurl") {
    return blobToDataUrl(blob)
  }

  const supabase = getUploadSupabaseClient()
  const id = crypto.randomUUID()
  const path = `apartments/${id}.jpg`

  try {
    const { error } = await supabase.storage
      .from("apartments")
      .upload(path, blob, {
        contentType: blob.type || "image/jpeg",
        upsert: false,
      })

    if (error) {
      throw new Error(error.message)
    }

    const { data } = supabase.storage.from("apartments").getPublicUrl(path)
    // TODO: add signed URLs or access control if needed in production
    return data.publicUrl
  } catch {
    // Storage can fail when bucket/policies are not ready; keep admin flow usable.
    return blobToDataUrl(blob)
  }
}
