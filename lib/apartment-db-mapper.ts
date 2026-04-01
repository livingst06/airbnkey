import { Prisma } from "@prisma/client"
import type { Apartment as ApartmentRow } from "@prisma/client"

import type { Apartment } from "@/types/apartments"

type JsonToStringsOpts = {
  /** Pour `advantages` : accepter nombres / booléens stringifiés (données Supabase / éditeur). */
  coercePrimitives?: boolean
}

function normalizeNonNegativeInt(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.min(2147483647, Math.floor(n))
}

function normalizeNullableNonNegativeInt(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.min(2147483647, Math.floor(n))
}

function normalizeNullableRating(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 5) return null
  return Math.round(n * 10) / 10
}

function jsonArrayElementToString(
  x: unknown,
  coercePrimitives: boolean,
): string | null {
  if (x === null || x === undefined) return null
  if (typeof x === "string") {
    const t = x.trim()
    return t.length > 0 ? t : null
  }
  if (coercePrimitives && (typeof x === "number" || typeof x === "boolean")) {
    return String(x)
  }
  return null
}

/**
 * JSON stocké ou valeur Prisma Json → string[] (lecture avantages / images).
 * Tolère d’anciennes lignes chaîne JSON. Option `coercePrimitives` pour avantages hétérogènes.
 */
export function jsonValueToStringArray(
  value: Prisma.JsonValue,
  opts?: JsonToStringsOpts,
): string[] {
  const coercePrimitives = opts?.coercePrimitives ?? false

  if (value === null || value === undefined) return []
  if (Array.isArray(value)) {
    return value
      .map((x) => jsonArrayElementToString(x, coercePrimitives))
      .filter((s): s is string => s !== null)
  }
  if (typeof value === "string") {
    try {
      const v: unknown = JSON.parse(value)
      if (Array.isArray(v)) {
        return v
          .map((x) => jsonArrayElementToString(x, coercePrimitives))
          .filter((s): s is string => s !== null)
      }
    } catch {
      return []
    }
  }
  return []
}

export function rowToApartment(row: ApartmentRow): Apartment {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    city: row.city?.trim() ? row.city : null,
    street: row.street?.trim() ? row.street : null,
    guests: normalizeNonNegativeInt(row.guests),
    beds: normalizeNonNegativeInt(row.beds),
    bathrooms: normalizeNonNegativeInt(row.bathrooms),
    reviewsCount: normalizeNullableNonNegativeInt(row.reviewsCount),
    ratingAverage: normalizeNullableRating(row.ratingAverage),
    advantages: jsonValueToStringArray(row.advantages, {
      coercePrimitives: true,
    }),
    latitude: row.latitude,
    longitude: row.longitude,
    position: normalizeNonNegativeInt(row.position),
    /** Chaque entrée : URL absolue, chemin `/...` (public), ou legacy `data:image/...`. */
    images: jsonValueToStringArray(row.images),
    bookingUrl: row.bookingUrl ?? null,
  }
}

/** Données Prisma pour `create` (mapping domaine → colonnes, y compris Json). */
export function apartmentToDbPayload(a: {
  id: string
  slug: string
  title: string
  description: string
  city?: string | null
  street?: string | null
  guests: number
  beds: number
  bathrooms: number
  reviewsCount?: number | null
  ratingAverage?: number | null
  advantages: string[]
  latitude: number
  longitude: number
  images: string[]
  bookingUrl?: string | null
  position?: number
}) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    city: a.city?.trim() || null,
    street: a.street?.trim() || null,
    guests: a.guests,
    beds: a.beds,
    bathrooms: a.bathrooms,
    reviewsCount: a.reviewsCount ?? null,
    ratingAverage: a.ratingAverage ?? null,
    latitude: a.latitude,
    longitude: a.longitude,
    advantages: a.advantages as Prisma.InputJsonValue,
    images: a.images as Prisma.InputJsonValue,
    bookingUrl: a.bookingUrl ?? null,
    position: a.position ?? 0,
  }
}

/** Données Prisma pour `update` — ne modifie pas `position` (réservé au réordonnancement). */
export function apartmentToPrismaUpdateData(
  data: Omit<Apartment, "id" | "slug" | "position">,
): {
  title: string
  description: string
  city: string | null
  street: string | null
  guests: number
  beds: number
  bathrooms: number
  reviewsCount: number | null
  ratingAverage: number | null
  latitude: number
  longitude: number
  advantages: Prisma.InputJsonValue
  images: Prisma.InputJsonValue
  bookingUrl: string | null
} {
  return {
    title: data.title,
    description: data.description,
    city: data.city?.trim() || null,
    street: data.street?.trim() || null,
    guests: data.guests,
    beds: data.beds,
    bathrooms: data.bathrooms,
    reviewsCount: data.reviewsCount ?? null,
    ratingAverage: data.ratingAverage ?? null,
    latitude: data.latitude,
    longitude: data.longitude,
    advantages: data.advantages as Prisma.InputJsonValue,
    images: data.images as Prisma.InputJsonValue,
    bookingUrl: data.bookingUrl ?? null,
  }
}
