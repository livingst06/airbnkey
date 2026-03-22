"use client"

import { useState } from "react"
import Image from "next/image"

type ApartmentCarouselProps = {
  images: string[]
  title: string
  slug: string
  /** Zoom image plus subtil dans la modale */
  variant?: "default" | "dialog"
}

const navButtonClass =
  "absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/30 text-2xl leading-none text-neutral-900 opacity-90 shadow-md backdrop-blur-md transition-all duration-200 ease-out hover:scale-105 hover:bg-white/40 active:scale-110 active:opacity-70 active:duration-150"

export function ApartmentCarousel({
  images,
  title,
  slug,
  variant = "default",
}: ApartmentCarouselProps) {
  const safeImages = images.slice(0, 4)
  const [currentIndex, setCurrentIndex] = useState(0)

  const hasMultipleImages = safeImages.length > 1

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

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      <button
        type="button"
        onClick={openHalldis}
        aria-label="Voir cet appartement sur Halldis"
        className="group absolute inset-0 z-0 cursor-pointer"
      >
        <Image
          src={safeImages[currentIndex]}
          alt={title}
          fill
          className={
            variant === "dialog"
              ? "object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              : "object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          }
          sizes="(min-width: 1024px) 600px, (min-width: 640px) 80vw, 100vw"
        />
      </button>

      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            aria-label="Image précédente"
            className={`left-3 ${navButtonClass}`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToNext}
            aria-label="Image suivante"
            className={`right-3 ${navButtonClass}`}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}

