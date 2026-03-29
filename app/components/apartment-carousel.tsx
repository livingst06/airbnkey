"use client"

import { useState } from "react"
import Image from "next/image"

import {
  carouselChevronIconClass,
  carouselNavButtonClass,
} from "@/lib/carousel-nav"
import { openBookingUrlInNewTab } from "@/lib/booking-provider"
import { imageNeedsUnoptimized } from "@/lib/image-src"
import { ChevronLeft, ChevronRight } from "lucide-react"

const DIALOG_MAX_IMAGES = 4
const CARD_MAX_IMAGES = 8

type ApartmentCarouselProps = {
  images: string[]
  title: string
  slug?: string
  /** Si renseigné, ouvre ce lien au clic sur l’image (dialog) au lieu de Halldis. */
  bookingUrl?: string | null
  /** card: grille (pas de lien sur l’image) ; dialog: modale ; default: liste legacy */
  variant?: "default" | "dialog" | "card"
  /** Variante card : LCP pour la première image de la première carte. */
  imagePriority?: boolean
}

export function ApartmentCarousel({
  images,
  title,
  slug = "",
  bookingUrl,
  variant = "default",
  imagePriority = false,
}: ApartmentCarouselProps) {
  const safeImages =
    variant === "card"
      ? images.slice(0, CARD_MAX_IMAGES)
      : images.slice(0, DIALOG_MAX_IMAGES)
  const [currentIndex, setCurrentIndex] = useState(0)

  const hasMultipleImages = safeImages.length > 1

  const currentSrc = safeImages[currentIndex]
  const unoptimized = imageNeedsUnoptimized(currentSrc)

  const goToPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!hasMultipleImages) return
    setCurrentIndex((prev) =>
      prev === 0 ? safeImages.length - 1 : prev - 1,
    )
  }

  const goToNext = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!hasMultipleImages) return
    setCurrentIndex((prev) =>
      prev === safeImages.length - 1 ? 0 : prev + 1,
    )
  }

  if (variant === "card") {
    const imageClassName =
      "object-cover transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-105"

    return (
      <div className="relative aspect-[3/2] h-full w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={currentSrc}
            alt={`${title} — photo ${currentIndex + 1} sur ${safeImages.length}`}
            fill
            style={{ willChange: "transform" }}
            className={`m-0 h-full w-full p-0 ${imageClassName}`}
            sizes="(min-width: 1536px) 14vw, (min-width: 1024px) 18vw, (min-width: 640px) 42vw, 100vw"
            priority={imagePriority && currentIndex === 0}
            unoptimized={unoptimized}
          />
        </div>

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Image précédente"
              className={`${carouselNavButtonClass} left-3 z-[12] opacity-70 hover:opacity-100`}
            >
              <ChevronLeft className={carouselChevronIconClass} />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Image suivante"
              className={`${carouselNavButtonClass} right-3 z-[12] opacity-70 hover:opacity-100`}
            >
              <ChevronRight className={carouselChevronIconClass} />
            </button>
            <div
              className="pointer-events-none absolute right-2 top-2 z-[11] rounded-full bg-black/45 px-2 py-0.5 text-[0.625rem] font-medium tabular-nums text-white/95 backdrop-blur-sm"
              aria-hidden
            >
              {currentIndex + 1}/{safeImages.length}
            </div>
          </>
        ) : null}
      </div>
    )
  }

  const trimmedBooking = bookingUrl?.trim() ?? ""
  const useCustomListing =
    trimmedBooking &&
    (trimmedBooking.startsWith("http://") ||
      trimmedBooking.startsWith("https://"))

  const openListing = () => {
    if (useCustomListing) {
      openBookingUrlInNewTab(trimmedBooking)
      return
    }
    const url = `https://www.halldis.com/${slug}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const imageClickAriaLabel = useCustomListing
    ? "Voir l’offre dans un nouvel onglet"
    : "Voir cet appartement sur Halldis"

  const imageClassName =
    variant === "dialog"
      ? "object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
      : "object-cover transition-transform duration-300 ease-out group-hover:scale-105"

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      <button
        type="button"
        onClick={openListing}
        aria-label={imageClickAriaLabel}
        className="group absolute inset-0 z-0 cursor-pointer"
      >
        <Image
          src={currentSrc}
          alt={title}
          fill
          className={`h-full w-full ${imageClassName}`}
          sizes="(min-width: 1024px) 600px, (min-width: 640px) 80vw, 100vw"
          priority={variant === "dialog" && currentIndex === 0}
          unoptimized={unoptimized}
        />
      </button>

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            onClick={(e) => goToPrevious(e)}
            aria-label="Image précédente"
            className={`${carouselNavButtonClass} left-3`}
          >
            <ChevronLeft className={carouselChevronIconClass} />
          </button>
          <button
            type="button"
            onClick={(e) => goToNext(e)}
            aria-label="Image suivante"
            className={`${carouselNavButtonClass} right-3`}
          >
            <ChevronRight className={carouselChevronIconClass} />
          </button>
        </>
      ) : null}
    </div>
  )
}
