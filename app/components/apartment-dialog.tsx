"use client"

import { useState } from "react"
import Image from "next/image"
import { Apartment } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type ApartmentDialogProps = {
  apartment: Apartment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApartmentDialog({
  apartment,
  open,
  onOpenChange,
}: ApartmentDialogProps) {
  const images = apartment.images.slice(0, 4)
  const [currentIndex, setCurrentIndex] = useState(0)

  const hasMultipleImages = images.length > 1

  const goToPrevious = () => {
    if (!hasMultipleImages) return

    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1,
    )
  }

  const goToNext = () => {
    if (!hasMultipleImages) return

    setCurrentIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1,
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={images[currentIndex]}
            alt={apartment.title}
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

        <div className="p-4 space-y-2">
          <DialogHeader className="space-y-1">
            <DialogTitle>{apartment.title}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {apartment.beds} couchages • {apartment.bathrooms} salle
              {apartment.bathrooms > 1 ? "s" : ""} de bain
            </p>
          </DialogHeader>

          <DialogDescription className="text-sm text-foreground">
            {apartment.description}
          </DialogDescription>

          {apartment.advantages?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {apartment.advantages.map((advantage) => (
                <Badge key={advantage} variant="secondary">
                  {advantage}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

