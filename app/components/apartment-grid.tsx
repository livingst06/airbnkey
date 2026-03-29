"use client"

import { useMemo } from "react"

import type { HoverSource } from "@/types/hover"
import type { Apartment, DialogAnchorRect } from "@/types/apartments"
import { Button } from "@/components/ui/button"
import { ApartmentCard } from "./apartment-card"
import { ApartmentDialog } from "./apartment-dialog"

type ApartmentGridProps = {
  apartments: Apartment[]
  selectedApartmentId: string | null
  dialogApartmentId: string | null
  dialogAnchorRect: DialogAnchorRect | null
  setSelectedApartmentId: (id: string | null) => void
  openApartmentDialog: (id: string | null, anchor?: DialogAnchorRect | null) => void
  hoveredApartmentId: string | null
  setHoveredApartmentId: (id: string | null) => void
  hoverSource: HoverSource
  setHoverSource: (source: HoverSource) => void
  hoverLock: boolean
  onResetFilters: () => void
}

export function ApartmentGrid({
  apartments,
  selectedApartmentId,
  dialogApartmentId,
  dialogAnchorRect,
  setSelectedApartmentId,
  openApartmentDialog,
  hoveredApartmentId,
  setHoveredApartmentId,
  hoverSource,
  setHoverSource,
  hoverLock,
  onResetFilters,
}: ApartmentGridProps) {
  const dialogApartment = useMemo(
    () => apartments.find((a) => a.id === dialogApartmentId) ?? null,
    [apartments, dialogApartmentId],
  )

  if (apartments.length === 0) {
    return (
      <div
        className="flex animate-in fade-in-0 zoom-in-95 flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border/70 bg-muted/25 px-6 py-14 text-center duration-300"
        role="status"
      >
        <p className="max-w-sm text-base font-medium text-foreground">
          Aucun appartement ne correspond à votre recherche
        </p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Élargissez les critères ou réinitialisez les filtres.
        </p>
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onResetFilters}
          className="rounded-xl"
        >
          Réinitialiser les filtres
        </Button>
      </div>
    )
  }

  return (
    <>
      {dialogApartment ? (
        <ApartmentDialog
          key={dialogApartment.id}
          apartment={dialogApartment}
          open
          anchorRect={dialogAnchorRect}
          onOpenChange={(open) => {
            if (!open) openApartmentDialog(null)
          }}
        />
      ) : null}
      <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @md:gap-3 @min-[52rem]:grid-cols-3 @min-[52rem]:gap-4">
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
              hoveredApartmentId={hoveredApartmentId}
              hoverSource={hoverSource}
            />
          </div>
        ))}
      </div>
    </>
  )
}
