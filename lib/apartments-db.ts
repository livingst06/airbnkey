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

/** Lecture directe BDD (source de vérité), sans cache — mutations, API, refetch client. */
export async function getApartmentsDb(): Promise<Apartment[]> {
  const rows = await prisma.apartment.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  })
  return rows.map(rowToApartment)
}

/**
 * Liste pour le layout RSC : invalidable via `revalidateTag('apartments')`.
 * @see app/actions/apartments.ts invalidateApartmentListCache
 */
export const getApartmentsCached = unstable_cache(
  async () => getApartmentsDb(),
  ["apartments-list"],
  { tags: [APARTMENTS_CACHE_TAG] },
)

export async function createApartmentDb(data: Apartment): Promise<Apartment> {
  const agg = await prisma.apartment.aggregate({ _max: { position: true } })
  const nextPosition = (agg._max.position ?? -1) + 1
  const row = await prisma.apartment.create({
    data: apartmentToDbPayload({ ...data, position: nextPosition }),
  })
  return rowToApartment(row)
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

