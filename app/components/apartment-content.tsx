"use client"

import { useMemo } from "react"

import type { Apartment } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"
import {
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  listingDetailBody,
  listingSectionLabel,
  listingTagBadgeClass,
} from "@/lib/listing-ui"
import {
  getBookingCtaLabel,
  getBookingProvider,
  openBookingUrlInNewTab,
} from "@/lib/booking-provider"
import { cn } from "@/lib/utils"
import { ApartmentCarousel } from "./apartment-carousel"
import { BookingBadge } from "./booking-badge"

/** Typo et hiérarchie identiques grille / modale */
const listingTitleClassName =
  "line-clamp-2 text-[1.0625rem] font-semibold leading-snug tracking-tight text-foreground lg:text-[1.125rem]"

const listingMetaClassName =
  "text-[0.8125rem] font-normal leading-normal text-muted-foreground"

const listingDescriptionClassName = cn(
  listingDetailBody,
  "line-clamp-4 text-[0.8125rem] text-muted-foreground",
)

export type ApartmentContentProps = {
  apartment: Apartment
  /** Grille vs modale : seulement coins carrousel, LCP image, aria / Radix */
  variant: "card" | "dialog"
  imagePriority?: boolean
  titleId?: string
}

export function ApartmentContent({
  apartment,
  variant,
  imagePriority = false,
  titleId,
}: ApartmentContentProps) {
  const isDialog = variant === "dialog"

  const listingHref = useMemo(() => {
    const t = apartment.bookingUrl?.trim()
    if (
      !t ||
      (!t.startsWith("http://") && !t.startsWith("https://"))
    ) {
      return null
    }
    return t
  }, [apartment.bookingUrl])

  const bookingProvider = useMemo(
    () => getBookingProvider(apartment.bookingUrl),
    [apartment.bookingUrl],
  )

  const advantages = apartment.advantages ?? []
  const visibleAdvantages = advantages.slice(0, 3)
  const extraAdvantageCount = Math.max(0, advantages.length - 3)

  const metaLine = `${apartment.beds} couchages • ${apartment.bathrooms} salle${apartment.bathrooms > 1 ? "s" : ""} de bain`
  const description = apartment.description?.trim() ?? ""

  const badgeBlock =
    listingHref && bookingProvider ? (
      <div className="mt-auto flex justify-end pt-3">
        <BookingBadge provider={bookingProvider} />
      </div>
    ) : null

  const titleBlock =
    isDialog ? (
      <DialogTitle asChild>
        <h2 className={listingTitleClassName}>{apartment.title}</h2>
      </DialogTitle>
    ) : (
      <h3 id={titleId} className={listingTitleClassName}>
        {apartment.title}
      </h3>
    )

  const descriptionBlock =
    description.length > 0 ? (
      isDialog ? (
        <DialogDescription asChild>
          <p className={listingDescriptionClassName}>{description}</p>
        </DialogDescription>
      ) : (
        <p className={listingDescriptionClassName}>{description}</p>
      )
    ) : isDialog ? (
      <DialogDescription className="sr-only">
        {apartment.title}
      </DialogDescription>
    ) : null

  return (
    <>
      <div
        className={cn(
          "relative w-full shrink-0 overflow-hidden",
          isDialog ? "rounded-t-3xl" : "rounded-t-xl",
        )}
      >
        <ApartmentCarousel
          images={apartment.images}
          title={apartment.title}
          imagePriority={!isDialog && imagePriority}
        />
        {listingHref ? (
          <div className="group/cta pointer-events-none absolute inset-x-0 bottom-0 z-[13] bg-gradient-to-t from-black/92 via-black/65 via-35% to-transparent px-3 pb-3 pt-14">
            <button
              type="button"
              className="pointer-events-auto w-full cursor-pointer text-center text-[0.8125rem] font-semibold tracking-tight text-white/95 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              onClick={(e) => {
                e.stopPropagation()
                openBookingUrlInNewTab(listingHref)
              }}
            >
              <span className="inline-block origin-bottom transition-all duration-200 ease-out will-change-transform group-hover/cta:-translate-y-1 group-hover/cta:scale-[1.06] group-hover/cta:text-white group-hover/cta:[text-shadow:0_0_18px_rgba(255,255,255,0.55),0_2px_8px_rgba(0,0,0,0.9)] group-hover/cta:brightness-110 active:translate-y-0 active:scale-100">
                {getBookingCtaLabel(bookingProvider)}
              </span>
            </button>
          </div>
        ) : null}
      </div>

      <CardContent className="flex min-h-0 flex-1 flex-col px-4 pt-4 pb-5">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {titleBlock}
          <p className={listingMetaClassName}>{metaLine}</p>
          {descriptionBlock}
          {advantages.length > 0 ? (
            <section className="space-y-0">
              <h3 className={cn(listingSectionLabel, "sr-only")}>
                Équipements
              </h3>
              <div className="flex flex-wrap gap-2">
                {visibleAdvantages.map((advantage: string, idx: number) => (
                  <Badge
                    key={`${apartment.id}-adv-${idx}-${advantage}`}
                    variant="outline"
                    className={listingTagBadgeClass}
                  >
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
            </section>
          ) : null}
        </div>
        {badgeBlock}
      </CardContent>
    </>
  )
}
