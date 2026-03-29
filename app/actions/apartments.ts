"use server"

import { updateTag } from "next/cache"

import {
  APARTMENTS_CACHE_TAG,
  createApartmentDb,
  deleteApartmentDb,
  getApartmentsDb,
  updateApartmentDb,
} from "@/lib/apartments-db"
import { apartmentFormSchema } from "@/lib/apartment-zod"
import type { ApartmentFormInput } from "@/lib/apartment-zod"
import type { Apartment } from "@/types/apartments"

/** Invalide le cache `unstable_cache` taggé (server actions → `updateTag`). */
function invalidateApartmentListCache() {
  updateTag(APARTMENTS_CACHE_TAG)
}

/** Liste ordonnée comme la DB — pour synchroniser le client après mutation. */
export async function listApartmentsAction(): Promise<Apartment[]> {
  return getApartmentsDb()
}

function slugify(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return slug
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "apartment"
  const existing = await getApartmentsDb()
  const slugs = new Set(existing.map((a) => a.slug))
  let slug = base
  let i = 1
  while (slugs.has(slug)) {
    slug = `${base}-${i}`
    i += 1
  }
  return slug
}

export async function createApartmentAction(input: ApartmentFormInput) {
  const parsed = apartmentFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: "Données invalides", issues: parsed.error.flatten() }
  }
  const p = parsed.data
  const id = generateId()
  const slug = await uniqueSlug(p.title)
  const apartment = await createApartmentDb({
    id,
    slug,
    title: p.title,
    description: p.description,
    beds: p.beds,
    bathrooms: p.bathrooms,
    advantages: p.advantages,
    latitude: p.latitude,
    longitude: p.longitude,
    images: p.images,
    bookingUrl: p.bookingUrl,
  })
  invalidateApartmentListCache()
  return { ok: true as const, apartment }
}

export async function updateApartmentAction(
  id: string,
  input: ApartmentFormInput,
) {
  const parsed = apartmentFormSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: "Données invalides", issues: parsed.error.flatten() }
  }
  const p = parsed.data
  const current = await getApartmentsDb()
  const existing = current.find((a) => a.id === id)
  if (!existing) {
    return { ok: false as const, error: "Introuvable" }
  }
  const apartment = await updateApartmentDb(id, {
    title: p.title,
    description: p.description,
    beds: p.beds,
    bathrooms: p.bathrooms,
    advantages: p.advantages,
    latitude: p.latitude,
    longitude: p.longitude,
    images: p.images,
    bookingUrl: p.bookingUrl,
  })
  if (!apartment) {
    return { ok: false as const, error: "Mise à jour impossible" }
  }
  invalidateApartmentListCache()
  return { ok: true as const, apartment }
}

export async function deleteApartmentAction(id: string) {
  const deleted = await deleteApartmentDb(id)
  if (!deleted) {
    return { ok: false as const, error: "Suppression impossible" }
  }
  invalidateApartmentListCache()
  return { ok: true as const }
}
