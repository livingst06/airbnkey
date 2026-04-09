"use client"

import { useMemo } from "react"
import {
  Bath,
  BedDouble,
  CigaretteOff,
  Star,
  Users,
  Wifi,
} from "lucide-react"

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

const splitListingTitleClassName =
  "xl:text-[0.92rem] xl:font-semibold xl:leading-tight xl:tracking-tight"

const listingMetaClassName =
  "text-[0.8125rem] font-normal leading-normal text-muted-foreground"

const splitListingMetaClassName =
  "xl:text-[0.8rem] xl:text-muted-foreground/90"

const listingDescriptionClassName = cn(
  listingDetailBody,
  "line-clamp-4 max-sm:line-clamp-5 text-[0.8125rem] text-muted-foreground",
)

const splitListingDescriptionClassName = cn(
  "xl:line-clamp-2 xl:text-[0.78rem] xl:leading-5 xl:text-muted-foreground/85",
)

function formatRatingAverage(value: number): string {
  return value.toFixed(1)
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

function getApartmentLocationLine(
  city: string | null | undefined,
  street: string | null | undefined,
): string | null {
  const normalizedCity = city?.trim() ?? ""
  if (!normalizedCity) return null

  const normalizedStreet = street?.trim() ?? ""
  return normalizedStreet
    ? `${normalizedCity.toUpperCase()} - ${normalizedStreet}`
    : normalizedCity.toUpperCase()
}

export type ApartmentContentProps = {
  apartment: Apartment
  /** Grille vs modale : seulement coins carrousel, LCP image, aria / Radix */
  variant: "card" | "dialog" | "split"
  imagePriority?: boolean
  titleId?: string
  /**
   * Cadre de sélection (padding + primary) : rayon du haut de la photo aligné
   * sur `calc(var(--radius-xl) - 0.125rem)` pour éviter les découpes aux coins.
   */
  selectionFrameInset?: boolean
}

export function ApartmentContent({
  apartment,
  variant,
  imagePriority = false,
  titleId,
  selectionFrameInset = false,
}: ApartmentContentProps) {
  const isDialog = variant === "dialog"
  const isSplit = variant === "split"

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

  const metaLine = `${pluralize(apartment.beds, "bed", "beds")} • ${pluralize(apartment.bathrooms, "bathroom", "bathrooms")}`
  const description = apartment.description?.trim() ?? ""
  const locationLine = getApartmentLocationLine(apartment.city, apartment.street)
  const hasRatingSummary =
    apartment.reviewsCount !== null &&
    apartment.reviewsCount !== undefined &&
    apartment.ratingAverage !== null &&
    apartment.ratingAverage !== undefined
  const splitMetaItems = [
    { key: "guests", icon: Users, label: `${apartment.guests} guests` },
    {
      key: "bathrooms",
      icon: Bath,
      label: `${apartment.bathrooms} bathroom${apartment.bathrooms > 1 ? "s" : ""}`,
    },
    {
      key: "bedrooms",
      icon: BedDouble,
      label: `${apartment.beds} bedroom${apartment.beds > 1 ? "s" : ""}`,
    },
    {
      key: "smoking",
      icon: CigaretteOff,
      label: "No smoking",
    },
    {
      key: "wifi",
      icon: Wifi,
      label: "Wifi",
    },
  ]

  const badgeBlock =
    listingHref && bookingProvider ? (
      <div className={cn("mt-auto flex justify-end pt-3", isSplit && "xl:pt-2")}>
        <BookingBadge provider={bookingProvider} />
      </div>
    ) : null

  const titleBlock =
    isDialog ? (
      <DialogTitle asChild>
        <h2 className={listingTitleClassName}>{apartment.title}</h2>
      </DialogTitle>
    ) : (
      <h3
        id={titleId}
        className={cn(listingTitleClassName, isSplit && splitListingTitleClassName)}
      >
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
        <p
          className={cn(
            listingDescriptionClassName,
            isSplit && splitListingDescriptionClassName,
          )}
        >
          {description}
        </p>
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
          "relative shrink-0 overflow-hidden",
          isDialog
            ? "rounded-t-3xl"
            : isSplit
              ? selectionFrameInset
                ? "w-full rounded-t-[max(0px,calc(var(--radius-xl)-0.125rem))] xl:h-full xl:w-[17rem] xl:rounded-l-[max(0px,calc(var(--radius-xl)-0.125rem))] xl:rounded-tr-none"
                : "w-full rounded-t-xl xl:h-full xl:w-[17rem] xl:rounded-l-xl xl:rounded-tr-none"
            : selectionFrameInset
              ? "rounded-t-[max(0px,calc(var(--radius-xl)-0.125rem))]"
              : "rounded-t-xl",
          isSplit ? "w-full xl:self-stretch" : "w-full",
        )}
      >
        <ApartmentCarousel
          images={apartment.images}
          title={apartment.title}
          imagePriority={!isDialog && imagePriority}
          layout={isSplit ? "split" : "default"}
        />
        {listingHref ? (
          <div
            className={cn(
              "group/cta pointer-events-none absolute inset-x-0 bottom-0 z-[13] bg-gradient-to-t from-black/92 via-black/65 via-35% to-transparent",
              isSplit ? "px-3 pb-3 pt-14 xl:px-2 xl:pb-2 xl:pt-10" : "px-3 pb-3 pt-14",
            )}
          >
            <button
              type="button"
              className="pointer-events-auto flex min-h-10 w-full cursor-pointer items-center justify-center px-2 py-2 text-center text-[0.8125rem] font-semibold tracking-tight text-white/95 [text-shadow:0_1px_4px_rgba(0,0,0,0.9)] outline-none transition-transform duration-100 ease-out focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-[0.97] md:hover:brightness-110"
              onClick={(e) => {
                e.stopPropagation()
                openBookingUrlInNewTab(listingHref)
              }}
            >
              <span className="inline-block md:transition-transform md:duration-150 md:ease-out md:group-hover/cta:scale-[1.02]">
                {getBookingCtaLabel(bookingProvider)}
              </span>
            </button>
          </div>
        ) : null}
      </div>

      <CardContent
        className={cn(
          "flex min-h-0 flex-1 flex-col px-4 pt-4 pb-5",
          isSplit && "xl:px-4 xl:py-4",
        )}
      >
        <div
          className={cn("flex min-h-0 flex-1 flex-col gap-3", isSplit && "xl:gap-3")}
        >
          {isSplit ? (
            <>
              <div className="space-y-2">
                {locationLine ? (
                  <div className="text-[0.72rem] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                    {locationLine}
                  </div>
                ) : null}
                {titleBlock}
              </div>

              <div className="h-px w-14 bg-white/8" aria-hidden />

              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {splitMetaItems.map(({ key, icon: Icon, label }) => (
                  <div
                    key={`${apartment.id}-${key}`}
                    className="flex items-center gap-2.5 text-[0.82rem] text-muted-foreground"
                  >
                    <Icon className="size-3.5 shrink-0 text-foreground/80" aria-hidden />
                    <span className="line-clamp-1">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto flex items-end justify-between gap-4">
                <div className="flex min-h-6 items-center gap-1.5">
                  {hasRatingSummary ? (
                    <div className="flex items-center gap-1.5 text-[0.95rem] font-semibold text-foreground">
                      <Star className="size-3.5 fill-rose-500 text-rose-500" aria-hidden />
                      <span>{formatRatingAverage(apartment.ratingAverage!)}</span>
                      <span className="text-[0.86rem] font-normal text-muted-foreground">
                        ({apartment.reviewsCount})
                      </span>
                    </div>
                  ) : null}
                </div>
                {advantages.length > 0 ? (
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {visibleAdvantages.map((advantage: string, idx: number) => (
                      <Badge
                        key={`${apartment.id}-adv-${idx}-${advantage}`}
                        variant="outline"
                        className="border-white/10 bg-white/[0.03] px-2 py-0.5 text-[0.66rem] leading-none text-muted-foreground"
                      >
                        {advantage}
                      </Badge>
                    ))}
                    {extraAdvantageCount > 0 ? (
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-white/[0.03] px-2 py-0.5 text-[0.66rem] leading-none text-muted-foreground dark:bg-white/[0.04]"
                        title={`${extraAdvantageCount} more`}
                      >
                        +{extraAdvantageCount}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {titleBlock}
              <p className={cn(listingMetaClassName, isSplit && splitListingMetaClassName)}>
                {metaLine}
              </p>
              {descriptionBlock}
              {advantages.length > 0 ? (
                <section className="space-y-0">
                  <h3 className={cn(listingSectionLabel, "sr-only")}>
                    Amenities
                  </h3>
                  <div className={cn("flex flex-wrap gap-2", isSplit && "xl:gap-1.5")}>
                    {visibleAdvantages.map((advantage: string, idx: number) => (
                      <Badge
                        key={`${apartment.id}-adv-${idx}-${advantage}`}
                        variant="outline"
                        className={cn(
                          listingTagBadgeClass,
                          isSplit && "xl:px-2.5 xl:py-1 xl:text-[0.7rem] xl:leading-none",
                        )}
                      >
                        {advantage}
                      </Badge>
                    ))}
                    {extraAdvantageCount > 0 ? (
                      <Badge
                        variant="outline"
                        className={cn(
                          listingTagBadgeClass,
                          isSplit &&
                            "xl:px-2.5 xl:py-1 xl:text-[0.7rem] xl:leading-none",
                          "bg-muted/20 dark:bg-white/[0.04]",
                        )}
                        title={`${extraAdvantageCount} more`}
                      >
                        +{extraAdvantageCount}
                      </Badge>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </>
          )}
        </div>
        {isSplit ? null : badgeBlock}
      </CardContent>
    </>
  )
}
