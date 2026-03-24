"use client"

import { apartments } from "@/data/apartments"
import { ApartmentCard } from "./apartment-card"
import type { Apartment } from "@/types/apartments"

type ApartmentGridProps = {
  selectedApartmentId: string | null
  dialogApartmentId: string | null
  setSelectedApartmentId: (id: string | null) => void
  setDialogApartmentId: (id: string | null) => void
}

export function ApartmentGrid({
  selectedApartmentId,
  dialogApartmentId,
  setSelectedApartmentId,
  setDialogApartmentId,
}: ApartmentGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {apartments.map((apartment: Apartment, index: number) => (
        <div
          key={apartment.id}
          className="h-full"
          onMouseEnter={() => setSelectedApartmentId(apartment.id)}
          onMouseLeave={() => setSelectedApartmentId(null)}
        >
          <ApartmentCard
            apartment={apartment}
            priority={index === 0}
            selectedApartmentId={selectedApartmentId}
            dialogApartmentId={dialogApartmentId}
            setDialogApartmentId={setDialogApartmentId}
          />
        </div>
      ))}
    </div>
  )
}