import type { Apartment as ApartmentRow } from "@prisma/client"

import type { Apartment } from "@/types/apartments"

function parseJsonArray(raw: string, fallback: string[]): string[] {
  try {
    const v: unknown = JSON.parse(raw)
    if (!Array.isArray(v)) return fallback
    return v.filter((x): x is string => typeof x === "string")
  } catch {
    return fallback
  }
}

export function rowToApartment(row: ApartmentRow): Apartment {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    beds: row.beds,
    bathrooms: row.bathrooms,
    advantages: parseJsonArray(row.advantages, []),
    latitude: row.latitude,
    longitude: row.longitude,
    images: parseJsonArray(row.images, []),
  }
}

export function apartmentToDbPayload(a: {
  id: string
  slug: string
  title: string
  description: string
  beds: number
  bathrooms: number
  advantages: string[]
  latitude: number
  longitude: number
  images: string[]
}) {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    beds: a.beds,
    bathrooms: a.bathrooms,
    latitude: a.latitude,
    longitude: a.longitude,
    advantages: JSON.stringify(a.advantages),
    images: JSON.stringify(a.images),
  }
}
