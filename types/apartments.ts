/**
 * Rectangle viewport (px) pour ancrer la modale.
 * - Grille : `align` omis → bord gauche de la modale ~ bord gauche de la carte.
 * - Pin carte : `align: "center"` → modale centrée sur le pin (recouvre le marqueur).
 */
export type DialogAnchorRect = {
  top: number
  left: number
  width: number
  height: number
  align?: "start" | "center"
}

export type Apartment = {
    id: string
    slug: string
    title: string
    city?: string | null
    street?: string | null
    guests: number
    beds: number
    bathrooms: number
    reviewsCount?: number | null
    ratingAverage?: number | null
    advantages: string[]
    description: string
    latitude: number
    longitude: number
    /** Ordre d'affichage (tri global ; réordonné en admin par drag & drop). */
    position: number
    /** URLs absolues, chemins sous /public, ou anciennes valeurs `data:image/...`. */
    images: string[]
    /** Lien externe de réservation (optionnel). */
    bookingUrl?: string | null
  }