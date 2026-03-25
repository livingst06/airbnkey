"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import type { HoverSource } from "@/types/hover"
import type { Apartment, DialogAnchorRect } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { listingTagBadgeClass } from "@/lib/listing-ui"
import { cn } from "@/lib/utils"

type Props = {
  apartment: Apartment
  priority?: boolean
  selectedApartmentId: string | null
  openApartmentDialog: (id: string | null, anchor?: DialogAnchorRect | null) => void
  hoveredApartmentId: string | null
  hoverSource: HoverSource
}

export function ApartmentCard({
  apartment,
  priority = false,
  selectedApartmentId,
  openApartmentDialog,
  hoveredApartmentId,
  hoverSource,
}: Props) {
  const isSyncedHover = hoveredApartmentId === apartment.id
  /** Survol liste sans hover synchronisé (ex. état transitoire) : ring seulement */
  const isListHoverHighlight =
    selectedApartmentId === apartment.id && !isSyncedHover
  const cardRef = useRef<HTMLDivElement>(null)
  const firstImage = apartment.images[0]
  const imageUnoptimized =
    firstImage?.startsWith("blob:") || firstImage?.startsWith("data:")
  const advantages = apartment.advantages ?? []
  const visibleAdvantages = advantages.slice(0, 3)
  const extraAdvantageCount = advantages.length - 3

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

  return (
    <div ref={cardRef} className="h-full">
      <Card
        role="button"
        tabIndex={0}
        aria-label={`Voir les détails : ${apartment.title}`}
        className={`group h-full cursor-pointer gap-0 overflow-hidden rounded-xl p-0 shadow-sm transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          isSyncedHover
            ? "shadow-lg ring-2 ring-primary md:scale-[1.01]"
            : isListHoverHighlight
              ? "ring-2 ring-primary"
              : "hover:shadow-md md:hover:scale-[1.01]"
        }`}
        onClick={() => {
          const el = cardRef.current
          const r = el?.getBoundingClientRect()
          openApartmentDialog(
            apartment.id,
            r
              ? {
                  top: r.top,
                  left: r.left,
                  width: r.width,
                  height: r.height,
                }
              : null,
          )
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            const el = cardRef.current
            const r = el?.getBoundingClientRect()
            openApartmentDialog(
              apartment.id,
              r
                ? {
                    top: r.top,
                    left: r.left,
                    width: r.width,
                    height: r.height,
                  }
                : null,
            )
          }
        }}
      >
        <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-t-xl">
          <Image
            src={firstImage}
            alt={apartment.title}
            fill
            style={{ willChange: "transform" }}
            className="m-0 h-full w-full object-cover p-0 transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-105"
            sizes="(min-width: 1536px) 14vw, (min-width: 1024px) 18vw, (min-width: 640px) 42vw, 100vw"
            priority={priority}
            unoptimized={imageUnoptimized}
          />
        </div>

        <CardContent className="flex flex-col px-4 pt-4 pb-5">
          <div className="flex flex-col gap-3">
            <h3 className="line-clamp-2 text-[1.0625rem] font-semibold leading-snug tracking-tight text-foreground lg:text-[1.125rem]">
              {apartment.title}
            </h3>

            <p className="text-[0.8125rem] font-normal leading-normal text-muted-foreground">
              {apartment.beds} couchages • {apartment.bathrooms} salle de bain
            </p>

            {advantages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {visibleAdvantages.map((advantage: string) => (
                  <Badge key={advantage} variant="outline" className={listingTagBadgeClass}>
                    {advantage}
                  </Badge>
                ))}
                {extraAdvantageCount > 0 ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      listingTagBadgeClass,
                      "bg-muted/20 dark:bg-white/[0.04]",
                    )}
                    title={`${extraAdvantageCount} autre${extraAdvantageCount > 1 ? "s" : ""}`}
                  >
                    +{extraAdvantageCount}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
