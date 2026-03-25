"use server"

import { revalidatePath } from "next/cache"

import {
  createApartmentDb,
  deleteApartmentDb,
  getApartmentsDb,
  updateApartmentDb,
} from "@/lib/apartments-db"
import { apartmentFormSchema } from "@/lib/apartment-zod"
import type { ApartmentFormInput } from "@/lib/apartment-zod"

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
  })
  revalidatePath("/")
  revalidatePath("/admin")
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
  })
  if (!apartment) {
    return { ok: false as const, error: "Mise à jour impossible" }
  }
  revalidatePath("/")
  revalidatePath("/admin")
  return { ok: true as const, apartment }
}

export async function deleteApartmentAction(id: string) {
  const deleted = await deleteApartmentDb(id)
  if (!deleted) {
    return { ok: false as const, error: "Suppression impossible" }
  }
  revalidatePath("/")
  revalidatePath("/admin")
  return { ok: true as const }
}
