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
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-orange-300/55 bg-orange-400 px-3 py-2 text-xs font-semibold tracking-tight text-orange-950 shadow-[0_10px_24px_rgba(251,146,60,0.32)] transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-orange-200/35 dark:bg-orange-400 dark:text-orange-950 dark:hover:bg-orange-300"
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
            className="h-10 w-10 rounded-full border border-black/14 bg-white/90 text-neutral-900 shadow-[0_6px_18px_rgba(0,0,0,0.16)] backdrop-blur-md transition-all duration-200 ease-out hover:border-red-500/40 hover:bg-red-500/92 hover:text-white active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/22 dark:bg-black/62 dark:text-white dark:hover:border-red-400/45 dark:hover:bg-red-500/82"
          >
            <X className="size-5 shrink-0" aria-hidden strokeWidth={2} />
          </Button>
        </div>
      }
    />
  )
}
