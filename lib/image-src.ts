export const APARTMENT_IMAGE_PLACEHOLDER = "/apartments/placeholder-transparent.svg"

/**
 * URLs Supabase Storage : l’optimiseur Next.js résout l’hôte côté serveur ; avec DNS/NAT64
 * certaines résolutions (ex. préfixe 64:ff9b::/96) sont traitées comme IP privée et le fetch
 * échoue (« resolved to private ip »). Le navigateur charge l’URL correctement : on évite l’optimiseur.
 */
function isSupabasePublicStorageUrl(src: string): boolean {
  if (!src.startsWith("https://")) return false
  try {
    const url = new URL(src)
    return (
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.includes("/storage/v1/object/public/")
    )
  } catch {
    return false
  }
}

/**
 * Indique si `next/image` doit éviter l’optimiseur (blob:, data:, schémas non supportés,
 * ou hébergements distants où le fetch serveur échoue — ex. Supabase + NAT64).
 */
export function imageNeedsUnoptimized(src: string | undefined): boolean {
  if (!src) return false
  return (
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    src.startsWith("file:") ||
    isSupabasePublicStorageUrl(src)
  )
}

export function getApartmentImageSrc(images: string[] | undefined, index = 0): string {
  const src = images?.[index]?.trim()
  return src && src.length > 0 ? src : APARTMENT_IMAGE_PLACEHOLDER
}

export function getApartmentImages(images: string[] | undefined): string[] {
  if (!images || images.length === 0) return [APARTMENT_IMAGE_PLACEHOLDER]
  const normalized = images
    .map((src) => src.trim())
    .filter((src) => src.length > 0)

  return normalized.length > 0 ? normalized : [APARTMENT_IMAGE_PLACEHOLDER]
}
