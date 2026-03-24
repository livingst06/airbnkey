"use client"

import { apartments } from "@/data/apartments"
import type { HoverSource } from "@/types/hover"
import type { Apartment } from "@/types/apartments"
import { ApartmentCard } from "./apartment-card"

type ApartmentGridProps = {
  selectedApartmentId: string | null
  dialogApartmentId: string | null
  setSelectedApartmentId: (id: string | null) => void
  setDialogApartmentId: (id: string | null) => void
  hoveredApartmentId: string | null
  setHoveredApartmentId: (id: string | null) => void
  hoverSource: HoverSource
  setHoverSource: (source: HoverSource) => void
  hoverLock: boolean
}

export function ApartmentGrid({
  selectedApartmentId,
  dialogApartmentId,
  setSelectedApartmentId,
  setDialogApartmentId,
  hoveredApartmentId,
  setHoveredApartmentId,
  hoverSource,
  setHoverSource,
  hoverLock,
}: ApartmentGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {apartments.map((apartment: Apartment, index: number) => (
        <div
          key={apartment.id}
          className="h-full"
          onMouseEnter={() => {
            setSelectedApartmentId(apartment.id)
            if (!hoverLock) {
              setHoverSource("list")
              setHoveredApartmentId(apartment.id)
            }
          }}
          onMouseLeave={() => {
            setSelectedApartmentId(null)
            if (!hoverLock) {
              setHoverSource(null)
              setHoveredApartmentId(null)
            }
          }}
        >
          <ApartmentCard
            apartment={apartment}
            priority={index === 0}
            selectedApartmentId={selectedApartmentId}
            dialogApartmentId={dialogApartmentId}
            setDialogApartmentId={setDialogApartmentId}
            hoveredApartmentId={hoveredApartmentId}
            hoverSource={hoverSource}
          />
        </div>
      ))}
    </div>
  )
}