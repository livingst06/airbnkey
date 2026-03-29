"use client"

import { useMemo } from "react"

import type { Apartment } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  listingDetailBody,
  listingDetailMeta,
  listingDetailTitle,
  listingHalldisCtaClassName,
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

export type ApartmentContentProps = {
  apartment: Apartment
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

  if (variant === "card") {
    const visibleAdvantages = advantages.slice(0, 3)
    const extraAdvantageCount = advantages.length - 3

    return (
      <>
        <div className="relative w-full shrink-0 overflow-hidden rounded-t-xl">
          <ApartmentCarousel
            variant="card"
            images={apartment.images}
            title={apartment.title}
            imagePriority={imagePriority}
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
            <h3
              id={titleId}
              className="line-clamp-2 text-[1.0625rem] font-semibold leading-snug tracking-tight text-foreground lg:text-[1.125rem]"
            >
              {apartment.title}
            </h3>

            <p className="text-[0.8125rem] font-normal leading-normal text-muted-foreground">
              {apartment.beds} couchages • {apartment.bathrooms} salle de bain
            </p>

            {advantages.length > 0 ? (
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
            ) : null}
          </div>

          {listingHref && bookingProvider ? (
            <div className="mt-auto flex justify-end pt-3">
              <BookingBadge provider={bookingProvider} />
            </div>
          ) : null}
        </CardContent>
      </>
    )
  }

  return (
    <>
      <ApartmentCarousel
        variant="dialog"
        images={apartment.images}
        title={apartment.title}
        slug={apartment.slug}
        bookingUrl={apartment.bookingUrl}
      />

      <div className="flex flex-col gap-8 px-4 pb-8 pt-2 sm:px-6 sm:pb-10 sm:pt-4">
        {listingHref ? (
          <button
            type="button"
            className={listingHalldisCtaClassName()}
            onClick={() => openBookingUrlInNewTab(listingHref)}
          >
            {getBookingCtaLabel(bookingProvider)}
            <span aria-hidden className="text-lg leading-none opacity-90">
              →
            </span>
          </button>
        ) : null}

        <DialogHeader className="space-y-0 gap-0 text-left">
          <DialogTitle className={listingDetailTitle}>
            {apartment.title}
          </DialogTitle>
          <p className={listingDetailMeta}>
            {apartment.beds} couchages • {apartment.bathrooms} salle
            {apartment.bathrooms > 1 ? "s" : ""} de bain
          </p>
        </DialogHeader>

        <DialogDescription
          className={cn(
            listingDetailBody,
            "text-foreground dark:text-foreground",
          )}
        >
          {apartment.description}
        </DialogDescription>

        {advantages.length > 0 ? (
          <section className="space-y-0">
            <h3 className={listingSectionLabel}>Équipements</h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {advantages.map((advantage, idx) => (
                <Badge
                  key={`${apartment.id}-adv-${idx}-${advantage}`}
                  variant="outline"
                  className={listingTagBadgeClass}
                >
                  {advantage}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {listingHref && bookingProvider ? (
          <div className="flex justify-end pt-1">
            <BookingBadge provider={bookingProvider} />
          </div>
        ) : null}
      </div>
    </>
  )
}
