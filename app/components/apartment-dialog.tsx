"use client"

import { useRef, useState, type ComponentPropsWithoutRef } from "react"

import { Apartment } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ArrowLeft, XIcon } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApartmentCarousel } from "./apartment-carousel"

const backToListButtonClass =
  "flex h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/80 px-5 text-base font-medium text-black/80 shadow-md ring-1 ring-black/5 backdrop-blur-lg transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-white/90 active:scale-95 dark:border-white/10 dark:bg-neutral-800/80 dark:text-white/90 dark:ring-white/10 dark:hover:bg-neutral-800/90"

type ApartmentDialogProps = {
  apartment: Apartment
  open: boolean
  onOpenChange: (open: boolean) => void
}

function BackToListButton({
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <DialogClose asChild>
      <button
        type="button"
        aria-label="Retour à la liste"
        className={cn(backToListButtonClass, className)}
        {...props}
      >
        <ArrowLeft className="h-4 w-4 opacity-70" />
        <span>Retour à la liste</span>
      </button>
    </DialogClose>
  )
}

export function ApartmentDialog({
  apartment,
  open,
  onOpenChange,
}: ApartmentDialogProps) {
  const images = apartment.images.slice(0, 4)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef<number | null>(null)
  const dragYRef = useRef(0)
  const canDragRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current
    if (!el) return
    const scrollTop = el.scrollTop ?? 0

    // autoriser drag UNIQUEMENT si scroll en haut
    canDragRef.current = scrollTop <= 0
    if (!canDragRef.current) return

    startYRef.current = e.touches[0].clientY
    dragYRef.current = 0
    setDragY(0)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current
    if (!el) return
    if (!canDragRef.current) return
    if (startYRef.current === null) return

    const currentY = e.touches[0].clientY
    const delta = currentY - startYRef.current
    if (delta <= 0) return

    dragYRef.current = delta
    setDragY(delta)

    // Pendant le drag actif, éviter les scroll/bounces parasites.
    if (e.nativeEvent.cancelable) e.preventDefault()

    // Pendant drag, on garde le canal "canDrag" ouvert.
    // (On le coupe au touchEnd.)
  }

  const handleTouchEnd = () => {
    if (!canDragRef.current) return

    setIsDragging(false)

    const finalDrag = dragYRef.current

    if (finalDrag > 120) {
      onOpenChange(false)
    } else {
      setDragY(0)
    }

    startYRef.current = null
    dragYRef.current = 0
    canDragRef.current = false
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,56rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-xl ring-0 transition-colors duration-300 dark:bg-neutral-800"
      >
        <DialogClose
          aria-label="Fermer"
          className="absolute right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition-all duration-200 ease-out hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/90"
        >
          <XIcon className="size-4 opacity-90" />
        </DialogClose>

        <div
          ref={scrollContainerRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateY(${dragY}px)`,
            transition: isDragging ? "none" : "transform 0.25s ease",
          }}
        >
          <div className="sticky top-4 z-50 flex w-full justify-center px-4">
            <BackToListButton />
          </div>

          <ApartmentCarousel
            variant="dialog"
            images={images}
            title={apartment.title}
            slug={apartment.slug}
          />

          <div className="space-y-4 p-8 md:space-y-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {apartment.title}
              </DialogTitle>
              <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
                {apartment.beds} couchages • {apartment.bathrooms} salle
                {apartment.bathrooms > 1 ? "s" : ""} de bain
              </p>
            </DialogHeader>

            <DialogDescription className="text-base leading-relaxed text-foreground/90 md:text-lg">
              {apartment.description}
            </DialogDescription>

            {apartment.advantages?.length ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {apartment.advantages.map((advantage) => (
                  <Badge
                    key={advantage}
                    variant="secondary"
                    className="h-auto min-h-0 rounded-full border-transparent bg-muted px-3 py-1 text-sm font-medium text-muted-foreground"
                  >
                    {advantage}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
