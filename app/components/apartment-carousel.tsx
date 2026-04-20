"use client"

import { useRef, useState } from "react"
import Image from "next/image"

import {
  carouselChevronIconClass,
} from "@/lib/carousel-nav"
import { MAX_APARTMENT_IMAGES } from "@/lib/apartment-image-constraints"
import { getApartmentImages, imageNeedsUnoptimized } from "@/lib/image-src"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

const MAX_IMAGES = MAX_APARTMENT_IMAGES

/** Distance mini (px) pour compter un swipe horizontal — sans preventDefault sur touchmove */
const SWIPE_THRESHOLD_PX = 50

/** |dx| doit dominer |dy| pour éviter de capter un scroll vertical */
const SWIPE_HORIZONTAL_DOMINANCE = 1.15

type ApartmentCarouselProps = {
  images: string[]
  title: string
  /** Grille : LCP sur la première image de la première carte */
  imagePriority?: boolean
  layout?: "default" | "split"
  onImageClick?: () => void
}

export function ApartmentCarousel({
  images,
  title,
  imagePriority = false,
  layout = "default",
  onImageClick,
}: ApartmentCarouselProps) {
  const safeImages = getApartmentImages(images).slice(0, MAX_IMAGES)
  const [currentIndex, setCurrentIndex] = useState(0)

  const touchStartRef = useRef<{
    x: number
    y: number
    id: number
  } | null>(null)
  const didSwipeRef = useRef(false)

  const hasMultipleImages = safeImages.length > 1

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

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.targetTouches[0]
    if (!t) return
    touchStartRef.current = {
      x: t.clientX,
      y: t.clientY,
      id: t.identifier,
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current
    touchStartRef.current = null
    if (!start || !hasMultipleImages) return

    const touch = Array.from(e.changedTouches).find(
      (x) => x.identifier === start.id,
    )
    if (!touch) return

    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
    if (Math.abs(dx) <= Math.abs(dy) * SWIPE_HORIZONTAL_DOMINANCE) return

    if (dx < 0) {
      didSwipeRef.current = true
      setCurrentIndex((prev) =>
        prev === safeImages.length - 1 ? 0 : prev + 1,
      )
    } else {
      didSwipeRef.current = true
      setCurrentIndex((prev) =>
        prev === 0 ? safeImages.length - 1 : prev - 1,
      )
    }
  }

  const imageHoverClass =
    "md:transition-[filter] md:duration-300 md:ease-out md:group-hover:brightness-105"
  const navButtonClass = cn(
    "absolute inset-y-0 z-[14] my-auto rounded-full border border-white/22 bg-black/38 text-white/95 shadow-[0_10px_26px_rgba(0,0,0,0.36)] backdrop-blur-md",
    "transition-colors duration-200 ease-out hover:bg-black/54",
    "opacity-100 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100",
    "focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0",
    layout === "split" ? "h-9 w-9 xl:h-8 xl:w-8" : "h-10 w-10",
  )

  return (
    <div
      onPointerDownCapture={(e) => e.stopPropagation()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        if (!onImageClick) return
        if (didSwipeRef.current) {
          didSwipeRef.current = false
          return
        }
        onImageClick()
      }}
      role={onImageClick ? "button" : undefined}
      tabIndex={onImageClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onImageClick) return
        if (e.key !== "Enter" && e.key !== " ") return
        e.preventDefault()
        onImageClick()
      }}
      data-layout={layout}
      className={cn(
        "group relative h-full w-full overflow-hidden",
        onImageClick && "cursor-pointer",
        layout === "split"
          ? "aspect-[3/2] xl:min-h-full xl:aspect-auto"
          : "aspect-[3/2]",
      )}
    >
      <div
        className="absolute inset-0 z-0 overflow-hidden"
        aria-live="polite"
      >
        <div
          className="flex h-full w-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {safeImages.map((src, index) => (
            <div key={`${src}-${index}`} className="relative h-full min-w-full">
              <Image
                src={src}
                alt={`${title} — photo ${index + 1} sur ${safeImages.length}`}
                fill
                className={cn(
                  "m-0 h-full w-full p-0 object-cover",
                  imageHoverClass,
                )}
                sizes={
                  layout === "split"
                    ? "(min-width: 1536px) 180px, (min-width: 1280px) 168px, (min-width: 1024px) 156px, 100vw"
                    : "(min-width: 1536px) 14vw, (min-width: 1024px) 18vw, (min-width: 640px) 42vw, 100vw"
                }
                priority={imagePriority && index === 0}
                unoptimized={imageNeedsUnoptimized(src)}
              />
            </div>
          ))}
        </div>
      </div>
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-[10] bg-gradient-to-t from-black/82 via-black/30 to-transparent",
          layout === "split" ? "h-24 xl:h-20" : "h-28",
        )}
        aria-hidden
      />

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={goToPrevious}
            aria-label="Image précédente"
            className={cn(navButtonClass, "left-3")}
          >
            <span className="grid h-full w-full place-items-center rounded-full ring-1 ring-white/18">
              <ChevronLeft className={carouselChevronIconClass} />
            </span>
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={goToNext}
            aria-label="Image suivante"
            className={cn(navButtonClass, "right-3")}
          >
            <span className="grid h-full w-full place-items-center rounded-full ring-1 ring-white/18">
              <ChevronRight className={carouselChevronIconClass} />
            </span>
          </button>
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-3 z-[12] flex items-center justify-center gap-2",
              layout === "split" && "xl:bottom-2.5 xl:gap-1.5",
            )}
            aria-label={`Image ${currentIndex + 1} sur ${safeImages.length}`}
          >
            {safeImages.map((_, index) => (
              <span
                key={`dot-${index}`}
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full bg-white/60 transition-all duration-200",
                  index === currentIndex && "w-2.5 bg-white/95",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
