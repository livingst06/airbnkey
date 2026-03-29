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
