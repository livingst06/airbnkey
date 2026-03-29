"use client"

import { useState } from "react"
import Image from "next/image"

import {
  carouselChevronIconClass,
  carouselNavButtonClass,
} from "@/lib/carousel-nav"
import { imageNeedsUnoptimized } from "@/lib/image-src"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MAX_IMAGES = 8

type ApartmentCarouselProps = {
  images: string[]
  title: string
  /** Grille : LCP sur la première image de la première carte */
  imagePriority?: boolean
}

export function ApartmentCarousel({
  images,
  title,
  imagePriority = false,
}: ApartmentCarouselProps) {
  const safeImages = images.slice(0, MAX_IMAGES)
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

  const imageClassName =
    "object-cover transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-105"

  return (
    <div className="group relative aspect-[3/2] h-full w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={currentSrc}
          alt={`${title} — photo ${currentIndex + 1} sur ${safeImages.length}`}
          fill
          style={{ willChange: "transform" }}
          className={cn("m-0 h-full w-full p-0", imageClassName)}
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
