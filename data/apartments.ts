import { Apartment } from "@/types/apartment"

export const apartments: Apartment[] = [
  {
    id: "1",
    slug: "studio-croisette",
    title: "Studio Croisette Vue Mer",
    beds: 2,
    bathrooms: 1,
    advantages: ["vue mer", "balcon"],
    description:
      "Studio lumineux situé sur la Croisette avec vue mer exceptionnelle.",
    latitude: 43.5528,
    longitude: 7.0174,
    images: [
      "/apartments/apt1/1.jpg",
      "/apartments/apt1/2.jpg",
      "/apartments/apt1/3.jpg",
      "/apartments/apt1/4.jpg"
    ]
  },
  {
    id: "2",
    slug: "t2-centre-ville",
    title: "Appartement Centre Cannes",
    beds: 4,
    bathrooms: 1,
    advantages: ["centre ville", "climatisation"],
    description:
      "Appartement moderne à 5 minutes du Palais des Festivals.",
    latitude: 43.553,
    longitude: 7.015,
    images: [
      "/apartments/apt2/1.jpg",
      "/apartments/apt2/2.jpg",
      "/apartments/apt2/3.jpg",
      "/apartments/apt2/4.jpg"
    ]
  },
  {
    id: "3",
    slug: "villa-palm-beach",
    title: "Appartement Palm Beach",
    beds: 6,
    bathrooms: 2,
    advantages: ["terrasse", "proche plage"],
    description:
      "Grand appartement familial proche des plages du Palm Beach.",
    latitude: 43.548,
    longitude: 7.035,
    images: [
      "/apartments/apt3/1.jpg",
      "/apartments/apt3/2.jpg",
      "/apartments/apt3/3.jpg",
      "/apartments/apt3/4.jpg"
    ]
  }
]