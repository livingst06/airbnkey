/** Identifiant stable du site de réservation (détection par sous-chaîne d’URL). */
export function getBookingProvider(url?: string | null): string | null {
  if (!url) return null

  const lower = url.toLowerCase()

  if (lower.includes("halldis")) return "halldis"
  if (lower.includes("airbnb") || lower.includes("abnb.me")) return "airbnb"
  if (lower.includes("booking.com")) return "booking"

  return null
}

/**
 * Libellé du bouton de réservation (aligné sur le badge : même détection via getBookingProvider).
 */
export function getBookingCtaLabel(provider: string | null): string {
  if (provider === "halldis") return "Voir sur Halldis"
  if (provider === "airbnb") return "Voir sur Airbnb"
  if (provider === "booking") return "Voir sur Booking.com"
  return "Voir l’offre"
}

/** Ouvre l'URL dans un nouvel onglet si le schéma est http(s). */
export function openBookingUrlInNewTab(url: string): void {
  const t = url.trim()
  if (!t.startsWith("http")) return
  window.open(t, "_blank", "noopener,noreferrer")
}
