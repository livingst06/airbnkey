"use client"

import { useMemo, useRef, useState } from "react"

import type { Apartment, DialogAnchorRect } from "@/types/apartments"
import { XIcon } from "lucide-react"

import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog"
import { ApartmentContent } from "./apartment-content"

const MAX_DIALOG_WIDTH_PX = 42 * 16 // max-w-2xl
const DIALOG_MARGIN = 12
/** En dessous : pas d'ancrage (centrage classique), cohérent avec mise en page une colonne / téléphone. */
const VIEWPORT_MIN_PX_FOR_ANCHORED_DIALOG = 1024 // tailwind `lg`

function anchoredDialogPosition(
  anchor: DialogAnchorRect,
  vw: number,
  vh: number,
): { left: number; top: number } {
  const maxW = Math.min(vw - 2 * DIALOG_MARGIN, MAX_DIALOG_WIDTH_PX)
  const pinCenterX = anchor.left + anchor.width / 2
  const left =
    anchor.align === "center"
      ? Math.max(
          DIALOG_MARGIN,
          Math.min(pinCenterX - maxW / 2, vw - maxW - DIALOG_MARGIN),
        )
      : Math.max(
          DIALOG_MARGIN,
          Math.min(anchor.left, vw - maxW - DIALOG_MARGIN),
        )
  const cardCenterY = anchor.top + anchor.height / 2
  const halfEst = Math.min(vh * 0.45, 28 * 16)
  const top = Math.max(
    DIALOG_MARGIN + halfEst,
    Math.min(vh - DIALOG_MARGIN - halfEst, cardCenterY),
  )
  return { left, top }
}

type ApartmentDialogProps = {
  apartment: Apartment
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Détail ouvert depuis la grille : ancrer la modale sur la carte cliquée. */
  anchorRect?: DialogAnchorRect | null
}

export function ApartmentDialog({
  apartment,
  open,
  onOpenChange,
  anchorRect = null,
}: ApartmentDialogProps) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef<number | null>(null)
  const dragYRef = useRef(0)
  const canDragRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const lastYRef = useRef(0)
  const lastTimeRef = useRef(0)
  const velocityRef = useRef(0)

  const anchorPosition = useMemo(() => {
    if (!open || !anchorRect || typeof window === "undefined") return null
    if (window.innerWidth < VIEWPORT_MIN_PX_FOR_ANCHORED_DIALOG) return null
    return anchoredDialogPosition(
      anchorRect,
      window.innerWidth,
      window.innerHeight,
    )
  }, [open, anchorRect])

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = scrollContainerRef.current
    if (!el) return
    // Autoriser le calcul du delta pour DOWN et UP.
    // La contrainte "DOWN bloqué si scrollTop > 5" est gérée dans `handleTouchMove`.
    canDragRef.current = true

    startYRef.current = e.touches[0].clientY
    lastYRef.current = e.touches[0].clientY
    lastTimeRef.current = Date.now()
    velocityRef.current = 0
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
    if (delta === 0) return

    // Estimation vitesse (px/ms) pour déclencher la fermeture même sur swipe court.
    const now = Date.now()
    const dy = currentY - lastYRef.current
    const dt = now - lastTimeRef.current
    if (dt > 0) {
      velocityRef.current = dy / dt
    }
    lastYRef.current = currentY
    lastTimeRef.current = now

    const scrollTop = el.scrollTop ?? 0

    // Swipe DOWN : bloqué si scroll pas en haut.
    if (delta > 0) {
      if (scrollTop > 5) return

      dragYRef.current = delta
      setDragY(delta)

      const absDelta = Math.abs(delta)
      const shouldClose =
        absDelta > 120 || Math.abs(velocityRef.current) > 0.5

      if (shouldClose) {
        canDragRef.current = false
        onOpenChange(false)
        return
      }

      // Pendant le drag actif, éviter les scroll/bounces parasites.
      if (e.nativeEvent.cancelable) e.preventDefault()
      return
    }

    // Swipe UP : autorisé seulement si scroll en haut.
    if (delta < 0) {
      if (scrollTop > 5) return

      const absDelta = Math.abs(delta)

      dragYRef.current = delta
      setDragY(delta)

      const shouldClose =
        absDelta > 120 || Math.abs(velocityRef.current) > 0.5

      if (shouldClose) {
        canDragRef.current = false
        onOpenChange(false)
        return
      }

      if (e.nativeEvent.cancelable) e.preventDefault()
    }
  }

  const handleTouchEnd = () => {
    if (!canDragRef.current) return

    setIsDragging(false)

    const finalDrag = dragYRef.current

    if (Math.abs(finalDrag) > 120) {
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
        anchorPosition={anchorPosition}
        className="flex max-h-[min(90dvh,56rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-xl ring-0 transition-colors duration-150 ease-out dark:bg-neutral-800"
      >
        <DialogClose
          aria-label="Fermer"
          className="absolute right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition-[background-color,transform,opacity] duration-150 ease-out hover:bg-neutral-100 active:scale-95 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/90"
        >
          <XIcon className="size-4 opacity-90" />
        </DialogClose>

        <div
          ref={scrollContainerRef}
          className="no-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translateY(${dragY}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
        >
          <ApartmentContent variant="dialog" apartment={apartment} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
