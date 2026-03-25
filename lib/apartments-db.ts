import { prisma } from "@/lib/prisma"
import { apartmentToDbPayload, rowToApartment } from "@/lib/apartment-db-mapper"
import type { Apartment } from "@/types/apartments"

export async function getApartmentsDb(): Promise<Apartment[]> {
  const rows = await prisma.apartment.findMany({
    orderBy: { createdAt: "asc" },
  })
  return rows.map(rowToApartment)
}

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
    data: {
      title: data.title,
      description: data.description,
      beds: data.beds,
      bathrooms: data.bathrooms,
      latitude: data.latitude,
      longitude: data.longitude,
      advantages: JSON.stringify(data.advantages),
      images: JSON.stringify(data.images),
    },
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
