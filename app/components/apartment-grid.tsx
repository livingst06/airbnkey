"use client"

import type { HoverSource } from "@/types/hover"
import type { Apartment } from "@/types/apartments"
import { ApartmentCard } from "./apartment-card"

type ApartmentGridProps = {
  apartments: Apartment[]
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
  apartments,
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
  if (apartments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
        Aucun appartement ne correspond à ces critères.
      </p>
    )
  }

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