/**
 * Style MapLibre : avec `NEXT_PUBLIC_MAPTILER_API_KEY`, toponymes et rendu pro (vectoriel).
 * Sinon repli sur les tuiles démo MapLibre.
 */
export function getMapStyleUrl(): string {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim()
  if (key) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(key)}`
  }
  return "https://demotiles.maplibre.org/style.json"
}
