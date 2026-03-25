"use client"

import { useState } from "react"
import Image from "next/image"

import {
  carouselChevronIconClass,
  carouselNavButtonClass,
} from "@/lib/carousel-nav"
import { ChevronLeft, ChevronRight } from "lucide-react"

type ApartmentCarouselProps = {
  images: string[]
  title: string
  slug: string
  /** default: grille liste ; dialog: modale détail */
  variant?: "default" | "dialog"
}

export function ApartmentCarousel({
  images,
  title,
  slug,
  variant = "default",
}: ApartmentCarouselProps) {
  const safeImages = images.slice(0, 4)
  const [currentIndex, setCurrentIndex] = useState(0)

  const hasMultipleImages = safeImages.length > 1

  const currentSrc = safeImages[currentIndex]
  const unoptimized = currentSrc?.startsWith("blob:") || currentSrc?.startsWith("data:")

  const goToPrevious = () => {
    if (!hasMultipleImages) return

    setCurrentIndex((prev) =>
      prev === 0 ? safeImages.length - 1 : prev - 1,
    )
  }

  const goToNext = () => {
    if (!hasMultipleImages) return

    setCurrentIndex((prev) =>
      prev === safeImages.length - 1 ? 0 : prev + 1,
    )
  }

  const openHalldis = () => {
    const url = `https://www.halldis.com/${slug}`
    window.open(url, "_blank")
  }

  const imageClassName =
    variant === "dialog"
      ? "object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
      : "object-cover transition-transform duration-300 ease-out group-hover:scale-105"

  const carouselBlock = (
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      <button
        type="button"
        onClick={openHalldis}
        aria-label="Voir cet appartement sur Halldis"
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

      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Image précédente"
            className={`${carouselNavButtonClass} left-3`}
          >
            <ChevronLeft className={carouselChevronIconClass} />
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Image suivante"
            className={`${carouselNavButtonClass} right-3`}
          >
            <ChevronRight className={carouselChevronIconClass} />
          </button>
        </>
      )}
    </div>
  )

  return carouselBlock
}

