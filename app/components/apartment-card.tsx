"use client"

import { useEffect, useRef } from "react"
import type { HoverSource } from "@/types/hover"
import type { Apartment } from "@/types/apartments"
import { Card } from "@/components/ui/card"
import { ApartmentContent } from "./apartment-content"

type Props = {
  apartment: Apartment
  priority?: boolean
  selectedApartmentId: string | null
  hoveredApartmentId: string | null
  hoverSource: HoverSource
}

export function ApartmentCard({
  apartment,
  priority = false,
  selectedApartmentId,
  hoveredApartmentId,
  hoverSource,
}: Props) {
  const isSyncedHover = hoveredApartmentId === apartment.id
  const isListHoverHighlight =
    selectedApartmentId === apartment.id && !isSyncedHover
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (hoverSource !== "map" || hoveredApartmentId !== apartment.id) return
    const el = cardRef.current
    if (!el) return

    const scrollRoot = el.closest("[data-list-scroll]")
    if (!(scrollRoot instanceof HTMLElement)) return

    const er = el.getBoundingClientRect()
    const margin = 8
    const maxScroll = Math.max(
      0,
      scrollRoot.scrollHeight - scrollRoot.clientHeight,
    )

    if (maxScroll <= 0) {
      const vh = typeof window !== "undefined" ? window.innerHeight : 0
      const fullyVisible =
        er.top >= -margin && er.bottom <= vh + margin
      if (fullyVisible) return
      el.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
        inline: "nearest",
      })
      return
    }

    const sr = scrollRoot.getBoundingClientRect()
    const fullyVisible =
      er.top >= sr.top - margin && er.bottom <= sr.bottom + margin
    if (fullyVisible) return

    const elCenter = er.top + er.height / 2
    const srCenter = sr.top + sr.height / 2
    const delta = elCenter - srCenter
    const nextTop = Math.min(
      maxScroll,
      Math.max(0, scrollRoot.scrollTop + delta),
    )

    scrollRoot.scrollTo({ top: nextTop, behavior: "smooth" })
  }, [hoverSource, hoveredApartmentId, apartment.id])

  const titleId = `apt-card-title-${apartment.id}`

  return (
    <div ref={cardRef} className="h-full">
      <Card
        role="article"
        aria-labelledby={titleId}
        className={`group flex h-full flex-col gap-0 overflow-hidden rounded-xl p-0 shadow-sm transition-[box-shadow,transform] duration-150 ease-out motion-reduce:transition-none ${
          isSyncedHover
            ? "shadow-lg ring-2 ring-primary md:scale-[1.01]"
            : isListHoverHighlight
              ? "ring-2 ring-primary"
              : "md:hover:shadow-lg md:hover:scale-[1.01]"
        }`}
      >
        <ApartmentContent
          variant="card"
          apartment={apartment}
          imagePriority={priority}
          titleId={titleId}
        />
      </Card>
    </div>
  )
}
