/**
 * Style MapLibre : avec `NEXT_PUBLIC_MAPTILER_API_KEY` → MapTiler streets-v2.
 * Sans clé : style vectoriel Carto Voyager (proche d’un fond « rues », lisible), pas les tuiles démo MapLibre.
 */
const CARTO_VOYAGER_STYLE =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

export function getMapStyleUrl(): string {
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim()
  if (key) {
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(key)}`
  }
  return CARTO_VOYAGER_STYLE
}
