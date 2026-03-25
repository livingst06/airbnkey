"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef } from "react"
import type { HoverSource } from "@/types/hover"
import { Apartment } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ApartmentDialog } from "./apartment-dialog"

type Props = {
  apartment: Apartment
  priority?: boolean
  selectedApartmentId: string | null
  dialogApartmentId: string | null
  setDialogApartmentId: (id: string | null) => void
  hoveredApartmentId: string | null
  hoverSource: HoverSource
}

export function ApartmentCard({
  apartment,
  priority = false,
  selectedApartmentId,
  dialogApartmentId,
  setDialogApartmentId,
  hoveredApartmentId,
  hoverSource,
}: Props) {
  const isSyncedHover = hoveredApartmentId === apartment.id
  /** Survol liste sans hover synchronisé (ex. état transitoire) : ring seulement */
  const isListHoverHighlight =
    selectedApartmentId === apartment.id && !isSyncedHover
  const cardRef = useRef<HTMLDivElement>(null)
  const firstImage = apartment.images[0]
  const imageUnoptimized =
    firstImage?.startsWith("blob:") || firstImage?.startsWith("data:")

  useEffect(() => {
    if (hoverSource !== "map" || hoveredApartmentId !== apartment.id) return
    const el = cardRef.current
    if (!el) return

    const scrollRoot = el.closest("[data-list-scroll]")
    if (!(scrollRoot instanceof HTMLElement)) return

    const er = el.getBoundingClientRect()
    const sr = scrollRoot.getBoundingClientRect()
    const margin = 8
    const fullyVisible =
      er.top >= sr.top - margin && er.bottom <= sr.bottom + margin
    if (fullyVisible) return

    const elCenter = er.top + er.height / 2
    const srCenter = sr.top + sr.height / 2
    const delta = elCenter - srCenter
    const maxScroll = Math.max(
      0,
      scrollRoot.scrollHeight - scrollRoot.clientHeight,
    )
    const nextTop = Math.min(
      maxScroll,
      Math.max(0, scrollRoot.scrollTop + delta),
    )

    scrollRoot.scrollTo({ top: nextTop, behavior: "smooth" })
  }, [hoverSource, hoveredApartmentId, apartment.id])

  return (
    <>
      <div ref={cardRef} className="h-full">
        <Card
          className={`group mx-4 h-full cursor-pointer gap-0 overflow-hidden rounded-2xl p-0 transition-all duration-200 ease-out md:mx-0 ${
            isSyncedHover
              ? "scale-[1.02] shadow-xl ring-2 ring-primary"
              : isListHoverHighlight
                ? "ring-2 ring-primary"
                : "hover:scale-[1.02]"
          }`}
          onClick={() => setDialogApartmentId(apartment.id)}
        >
          <div
            className="relative aspect-[4/3] w-full shrink-0 cursor-pointer overflow-hidden rounded-t-2xl"
            role="button"
            tabIndex={0}
            aria-label="Voir cet appartement sur Halldis"
            onClick={(e) => {
              e.stopPropagation()
              window.open(
                `https://www.halldis.com/${apartment.slug}`,
                "_blank",
              )
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                e.stopPropagation()
                window.open(
                  `https://www.halldis.com/${apartment.slug}`,
                  "_blank",
                )
              }
            }}
          >
            <Image
              src={firstImage}
              alt={apartment.title}
              fill
              style={{ willChange: "transform" }}
              className="m-0 h-full w-full object-cover p-0 transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.03] group-hover:brightness-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              unoptimized={imageUnoptimized}
            />
            <div
              className="pointer-events-none absolute bottom-0 left-0 w-full bg-black/40 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100"
              aria-hidden
            >
              Voir sur Halldis →
            </div>
          </div>

          <CardContent className="space-y-3 p-4">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {apartment.title}
            </h3>

            <p className="text-sm text-muted-foreground">
              {apartment.beds} couchages • {apartment.bathrooms} salle de bain
            </p>

            {apartment.advantages?.length ? (
              <div className="flex flex-wrap gap-2">
                {apartment.advantages.map((advantage: string) => (
                  <Badge key={advantage} variant="secondary">
                    {advantage}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div>
              <Link
                href={`/appartement/${apartment.slug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex rounded-xl bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition-all duration-200 ease-out hover:bg-primary/10 hover:shadow-md hover:-translate-y-0.5 active:scale-95 active:shadow-sm"
              >
                Voir les détails
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <ApartmentDialog
        apartment={apartment}
        open={dialogApartmentId === apartment.id}
        onOpenChange={(open) =>
          setDialogApartmentId(open ? apartment.id : null)
        }
      />
    </>
  )
}
