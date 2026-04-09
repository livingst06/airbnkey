"use server"

import { Prisma } from "@prisma/client"
import { revalidatePath, updateTag } from "next/cache"

import {
  APARTMENTS_CACHE_TAG,
  createApartmentDb,
  deleteApartmentDb,
  getApartmentsFresh,
  updateApartmentDb,
  updateApartmentsOrderDb,
} from "@/lib/apartments-db"
import { formatApartmentFormErrorMessage } from "@/lib/apartment-form-error-message"
import { apartmentFormSchema } from "@/lib/apartment-zod"
import type { ApartmentFormInput } from "@/lib/apartment-zod"
import type { Apartment } from "@/types/apartments"

/** Invalide le cache `unstable_cache` taggé (server actions → `updateTag`). */
function invalidateApartmentListCache() {
  updateTag(APARTMENTS_CACHE_TAG)
  revalidatePath("/")
}

/** Liste ordonnée comme la DB — pour synchroniser le client après mutation. */
export async function listApartmentsAction(): Promise<Apartment[]> {
  return getApartmentsFresh()
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

function isSlugConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes("slug")
  )
}

async function createApartmentWithUniqueSlug(input: ApartmentFormInput) {
  const baseSlug = slugify(input.title) || "apartment"
  const id = generateId()

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`
    try {
      return await createApartmentDb({
        id,
        slug,
        title: input.title,
        description: input.description,
        city: input.city,
        street: input.street,
        guests: input.guests,
        beds: input.beds,
        bathrooms: input.bathrooms,
        reviewsCount: input.reviewsCount,
        ratingAverage: input.ratingAverage,
        advantages: input.advantages,
        latitude: input.latitude,
        longitude: input.longitude,
        images: input.images,
        bookingUrl: input.bookingUrl,
        position: 0,
      })
    } catch (error) {
      if (!isSlugConflict(error) || attempt === 4) throw error
    }
  }

  throw new Error("createApartmentWithUniqueSlug failed")
}

export async function createApartmentAction(input: ApartmentFormInput) {
  if (!isAdminEnv()) {
    return { ok: false as const, error: "Not authorized" }
  }
  const parsed = apartmentFormSchema.safeParse(input)
  if (!parsed.success) {
    const issues = parsed.error.flatten()
    return {
      ok: false as const,
      error: "Invalid data",
      userMessage: formatApartmentFormErrorMessage(issues),
      issues,
    }
  }
  try {
    const apartment = await createApartmentWithUniqueSlug(parsed.data)
    invalidateApartmentListCache()
    return { ok: true as const, apartment }
  } catch {
    return { ok: false as const, error: "Creation failed" }
  }
}

export async function updateApartmentAction(
  id: string,
  input: ApartmentFormInput,
) {
  if (!isAdminEnv()) {
    return { ok: false as const, error: "Not authorized" }
  }
  const parsed = apartmentFormSchema.safeParse(input)
  if (!parsed.success) {
    const issues = parsed.error.flatten()
    return {
      ok: false as const,
      error: "Invalid data",
      userMessage: formatApartmentFormErrorMessage(issues),
      issues,
    }
  }
  const p = parsed.data
  const current = await getApartmentsFresh()
  const existing = current.find((a) => a.id === id)
  if (!existing) {
    return { ok: false as const, error: "Not found" }
  }
  try {
    const apartment = await updateApartmentDb(id, {
      title: p.title,
      description: p.description,
      city: p.city,
      street: p.street,
      guests: p.guests,
      beds: p.beds,
      bathrooms: p.bathrooms,
      reviewsCount: p.reviewsCount,
      ratingAverage: p.ratingAverage,
      advantages: p.advantages,
      latitude: p.latitude,
      longitude: p.longitude,
      images: p.images,
      bookingUrl: p.bookingUrl,
    })
    if (!apartment) {
      return { ok: false as const, error: "Update failed" }
    }
    invalidateApartmentListCache()
    return { ok: true as const, apartment }
  } catch {
    return { ok: false as const, error: "Update failed" }
  }
}

export async function deleteApartmentAction(id: string) {
  if (!isAdminEnv()) {
    return { ok: false as const, error: "Not authorized" }
  }
  try {
    const deleted = await deleteApartmentDb(id)
    if (!deleted) {
      return { ok: false as const, error: "Delete failed" }
    }
    invalidateApartmentListCache()
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: "Delete failed" }
  }
}

function isAdminEnv(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_MODE === "true"
}

export async function updateApartmentsOrderAction(
  ordered: { id: string; position: number }[],
) {
  if (!isAdminEnv()) {
    return { ok: false as const, error: "Not authorized" }
  }
  if (ordered.length === 0) {
    return { ok: true as const }
  }
  const current = await getApartmentsFresh()
  if (ordered.length !== current.length) {
    return { ok: false as const, error: "Incomplete list" }
  }
  const expectedIds = new Set(current.map((a) => a.id))
  const seen = new Set<string>()
  for (const row of ordered) {
    if (!expectedIds.has(row.id) || seen.has(row.id)) {
      return { ok: false as const, error: "Invalid apartment IDs" }
    }
    seen.add(row.id)
  }
  if (seen.size !== expectedIds.size) {
    return { ok: false as const, error: "Invalid apartment IDs" }
  }
  const byPos = [...ordered].sort((a, b) => a.position - b.position)
  for (let i = 0; i < byPos.length; i++) {
    if (byPos[i].position !== i) {
      return { ok: false as const, error: "Invalid apartment positions" }
    }
  }
  try {
    await updateApartmentsOrderDb(byPos)
    invalidateApartmentListCache()
    return { ok: true as const }
  } catch {
    return { ok: false as const, error: "Order not saved" }
  }
}

