"use client"

import { type ReactNode, useEffect, useRef } from "react"
import type { HoverSource } from "@/types/hover"
import type { Apartment } from "@/types/apartments"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ApartmentContent } from "./apartment-content"

type Props = {
  apartment: Apartment
  priority?: boolean
  selectedApartmentId?: string | null
  hoveredApartmentId?: string | null
  hoverSource?: HoverSource
  layout?: "default" | "desktopSplit"
  titleIdPrefix?: string
  overlaySlot?: ReactNode
  footerSlot?: ReactNode
  className?: string
}

export function ApartmentCard({
  apartment,
  priority = false,
  hoveredApartmentId = null,
  hoverSource = null,
  layout = "default",
  titleIdPrefix = "apt-card-title",
  overlaySlot,
  footerSlot,
  className,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isMapHoverHighlight =
    hoverSource === "map" && hoveredApartmentId === apartment.id

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
      const canSyncThroughDocumentScroll =
        typeof window !== "undefined" &&
        window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches
      // Mobile/touch: never scroll the document programmatically.
      if (!canSyncThroughDocumentScroll) return
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

  const titleId = `${titleIdPrefix}-${apartment.id}`
  const isSplit = layout === "desktopSplit"

  const inner = (
    <ApartmentContent
      variant={isSplit ? "split" : "card"}
      apartment={apartment}
      imagePriority={priority}
      titleId={titleId}
      selectionFrameInset={false}
    />
  )

  return (
    <div ref={cardRef} className="h-full">
      <div className="relative h-full">
        <Card
          role="article"
          aria-labelledby={titleId}
          className={cn(
            "group flex gap-0 overflow-hidden rounded-2xl border border-border/65 bg-card/92 p-0 shadow-[0_12px_28px_rgba(16,18,24,0.08)] transition-colors duration-200 dark:shadow-[0_16px_32px_rgba(0,0,0,0.32)]",
            isMapHoverHighlight &&
              "border-slate-500/70 dark:border-slate-300/75",
            isSplit
              ? "h-full flex-col xl:min-h-[15rem] xl:flex-row"
              : "h-full flex-col",
            className,
          )}
        >
          {inner}
        </Card>
        {overlaySlot}
      </div>
      {footerSlot ? <div className="pt-2">{footerSlot}</div> : null}
    </div>
  )
}
