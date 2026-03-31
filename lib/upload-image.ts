/**
 * Upload client d’une image vers une URL publique (DB : `string[]` d’URLs).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import {
  blobToDataUrl,
  compressImageFileToBlob,
} from "@/lib/image-compress"

let browserClient: SupabaseClient | null = null
const SUPABASE_UPLOAD_ERROR =
  "Upload image indisponible : configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY, ou utilisez NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK=dataurl."

function getSupabaseBrowserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    throw new Error(SUPABASE_UPLOAD_ERROR)
  }
  if (!browserClient) {
    browserClient = createClient(url, key)
  }
  return browserClient
}

/**
 * Prépare l’image (compression) puis retourne une URL à persister.
 * - `NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK=dataurl` : data URL (legacy / hors-ligne).
 * - Sinon : upload vers Supabase Storage (bucket `apartments`).
 */
export async function uploadImage(file: File): Promise<string> {
  if (process.env.NEXT_PUBLIC_IMAGE_UPLOAD_FALLBACK === "dataurl") {
    const blob = await compressImageFileToBlob(file)
    return blobToDataUrl(blob)
  }

  const blob = await compressImageFileToBlob(file)
  const supabase = getSupabaseBrowserClient()
  const id = crypto.randomUUID()
  const path = `apartments/${id}.jpg`

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
}
