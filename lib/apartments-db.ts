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
    orderBy: { createdAt: "asc" },
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
  const row = await prisma.apartment.create({
    data: apartmentToDbPayload(data),
  })
  return rowToApartment(row)
}

export async function updateApartmentDb(
  id: string,
  data: Omit<Apartment, "id" | "slug"> & { slug?: string },
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
