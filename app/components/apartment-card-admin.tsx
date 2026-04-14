"use client"

import type { Apartment } from "@/types/apartments"
import type { HoverSource } from "@/types/hover"
import { Pencil, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ApartmentCard } from "./apartment-card"

type ApartmentCardAdminProps = {
  apartment: Apartment
  index: number
  selectedApartmentId: string | null
  hoveredApartmentId: string | null
  hoverSource: HoverSource
  onEdit: () => void
  onDelete: () => void
}

export function ApartmentCardAdmin({
  apartment,
  index,
  selectedApartmentId,
  hoveredApartmentId,
  hoverSource,
  onEdit,
  onDelete,
}: ApartmentCardAdminProps) {
  return (
    <ApartmentCard
      apartment={apartment}
      priority={index === 0}
      selectedApartmentId={selectedApartmentId}
      hoveredApartmentId={hoveredApartmentId}
      hoverSource={hoverSource}
      layout="desktopSplit"
      titleIdPrefix="admin-apt-card-title"
      overlaySlot={
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          <button
            type="button"
            aria-label="Edit this apartment"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-amber-500/45 bg-amber-500/85 px-3 py-2 text-xs font-semibold tracking-tight text-amber-950 shadow-[0_8px_20px_rgba(217,119,6,0.3)] transition-colors duration-200 ease-out hover:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Pencil className="size-3.5 shrink-0" aria-hidden strokeWidth={2.2} />
            <span>Edit</span>
          </button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Delete this apartment"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="h-10 w-10 rounded-full border border-border/70 bg-card/85 text-foreground shadow-[0_6px_18px_rgba(0,0,0,0.16)] backdrop-blur-md transition-colors duration-200 ease-out hover:border-red-500/40 hover:bg-red-500/88 hover:text-white focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <X className="size-5 shrink-0" aria-hidden strokeWidth={2} />
          </Button>
        </div>
      }
    />
  )
}
