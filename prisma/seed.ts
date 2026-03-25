import { PrismaClient } from "@prisma/client"

import { apartments as seedApartments } from "../data/apartments"
import { apartmentToDbPayload } from "../lib/apartment-db-mapper"

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.apartment.count()
  if (count > 0) {
    console.log(`Seed skip: ${count} apartment(s) already in DB`)
    return
  }

  for (const a of seedApartments) {
    await prisma.apartment.create({
      data: apartmentToDbPayload({ ...a, advantages: [...a.advantages], images: [...a.images] }),
    })
  }
  console.log(`Seeded ${seedApartments.length} apartments`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
