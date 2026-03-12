import { apartments } from "@/data/apartments"
import { ApartmentCard } from "./apartment-card"

export function ApartmentGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {apartments.map((apartment, index) => (
        <ApartmentCard
          key={apartment.id}
          apartment={apartment}
          priority={index === 0}
        />
      ))}
    </div>
  )
}