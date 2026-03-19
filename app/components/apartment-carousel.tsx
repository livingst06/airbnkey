"use client"

import { useState } from "react"
import Image from "next/image"

type ApartmentCarouselProps = {
  images: string[]
  title: string
}

export function ApartmentCarousel({
  images,
  title,
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

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden">
      <Image
        src={safeImages[currentIndex]}
        alt={title}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 600px, (min-width: 640px) 80vw, 100vw"
      />

      {hasMultipleImages && (
        <>
          <button
            type="button"
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-xs text-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-xs text-white"
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}

