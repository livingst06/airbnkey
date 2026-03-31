import { Prisma } from "@prisma/client"
import { unstable_cache } from "next/cache"

import {
  apartmentToDbPayload,
  apartmentToPrismaUpdateData,
  rowToApartment,
} from "@/lib/apartment-db-mapper"
import { prisma } from "@/lib/prisma"
import type { Apartment } from "@/types/apartments"

/** Même chaîne que `revalidateTag` dans les server actions. */
export const APARTMENTS_CACHE_TAG = "apartments"

const APARTMENTS_ORDER_BY: Prisma.ApartmentOrderByWithRelationInput[] = [
  { position: "asc" },
  { createdAt: "asc" },
]
const CREATE_APARTMENT_MAX_RETRIES = 3

function isRetryableCreateError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2002" || error.code === "P2034")
  )
}

/** Lecture directe BDD (source de vérité), sans cache — mutations, API, refetch client. */
export async function getApartmentsFresh(): Promise<Apartment[]> {
  const rows = await prisma.apartment.findMany({
    orderBy: APARTMENTS_ORDER_BY,
  })
  return rows.map(rowToApartment)
}

/** Alias explicite pour les appels existants et les usages qui veulent une lecture fraîche. */
export const getApartmentsDb = getApartmentsFresh

/**
 * Liste cache taggée pour les RSC / pages.
 * @see app/actions/apartments.ts invalidateApartmentListCache
 */
export const getApartmentsCached = unstable_cache(
  async () => getApartmentsFresh(),
  ["apartments-list"],
  { tags: [APARTMENTS_CACHE_TAG] },
)

export async function createApartmentDb(data: Apartment): Promise<Apartment> {
  let lastError: unknown

  for (let attempt = 0; attempt < CREATE_APARTMENT_MAX_RETRIES; attempt++) {
    try {
      const row = await prisma.$transaction(
        async (tx) => {
          const agg = await tx.apartment.aggregate({ _max: { position: true } })
          const nextPosition = (agg._max.position ?? -1) + 1
          return tx.apartment.create({
            data: apartmentToDbPayload({ ...data, position: nextPosition }),
          })
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      )
      return rowToApartment(row)
    } catch (error) {
      lastError = error
      if (!isRetryableCreateError(error) || attempt === CREATE_APARTMENT_MAX_RETRIES - 1) {
        throw error
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("createApartmentDb failed")
}

export async function updateApartmentDb(
  id: string,
  data: Omit<Apartment, "id" | "slug" | "position"> & { slug?: string },
): Promise<Apartment | null> {
  const existing = await prisma.apartment.findUnique({ where: { id } })
  if (!existing) return null

  const row = await prisma.apartment.update({
    where: { id },
    data: apartmentToPrismaUpdateData(data),
  })
  return rowToApartment(row)
}

export async function deleteApartmentDb(id: string): Promise<boolean> {
  try {
    await prisma.apartment.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}

/** Réordonne en deux passes pour éviter les collisions temporaires sur `position`. */
export async function updateApartmentsOrderDb(
  ordered: { id: string; position: number }[],
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < ordered.length; i++) {
      const { id } = ordered[i]
      await tx.apartment.update({
        where: { id },
        data: { position: -(i + 1) },
      })
    }
    for (const { id, position } of ordered) {
      await tx.apartment.update({
        where: { id },
        data: { position },
      })
    }
  })
}

