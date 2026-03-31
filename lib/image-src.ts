export const APARTMENT_IMAGE_PLACEHOLDER = "/apartments/placeholder-transparent.svg"

/**
 * Indique si `next/image` doit éviter l’optimiseur (blob:, data:, schémas non supportés).
 */
export function imageNeedsUnoptimized(src: string | undefined): boolean {
  if (!src) return false
  return (
    src.startsWith("blob:") ||
    src.startsWith("data:") ||
    src.startsWith("file:")
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
