import { PrismaClient } from "@prisma/client"

import { apartmentToDbPayload } from "../lib/apartment-db-mapper"

const prisma = new PrismaClient()
const seedApartments = [
  {
    id: "1",
    slug: "studio-croisette",
    title: "Studio Croisette Vue Mer",
    city: "Cannes",
    guests: 2,
    beds: 2,
    bathrooms: 1,
    advantages: ["vue mer", "balcon"],
    description: "Studio lumineux situé sur la Croisette avec vue mer exceptionnelle.",
    latitude: 43.5528,
    longitude: 7.0174,
    position: 0,
    images: [
      "/apartments/apt1/1.png",
      "/apartments/apt1/2.png",
      "/apartments/apt1/3.png",
      "/apartments/apt1/4.png",
    ],
    bookingUrl: "https://www.airbnb.com/rooms/studio-croisette-vue-mer",
  },
  {
    id: "2",
    slug: "t2-centre-ville",
    title: "Appartement Centre Cannes",
    city: "Cannes",
    guests: 4,
    beds: 4,
    bathrooms: 1,
    advantages: ["centre ville", "climatisation"],
    description: "Appartement moderne à 5 minutes du Palais des Festivals.",
    latitude: 43.553,
    longitude: 7.015,
    position: 1,
    images: [
      "/apartments/apt2/1.png",
      "/apartments/apt2/2.png",
      "/apartments/apt2/3.png",
      "/apartments/apt2/4.png",
    ],
    bookingUrl: "https://www.airbnb.com/rooms/appartement-centre-cannes",
  },
  {
    id: "3",
    slug: "villa-palm-beach",
    title: "Appartement Palm Beach",
    city: "Cannes",
    guests: 6,
    beds: 6,
    bathrooms: 2,
    advantages: ["terrasse", "proche plage"],
    description: "Grand appartement familial proche des plages du Palm Beach.",
    latitude: 43.548,
    longitude: 7.035,
    position: 2,
    images: [
      "/apartments/apt3/1.png",
      "/apartments/apt3/2.png",
      "/apartments/apt3/3.png",
      "/apartments/apt3/4.png",
    ],
    bookingUrl: "https://www.airbnb.com/rooms/appartement-palm-beach",
  },
] as const

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
