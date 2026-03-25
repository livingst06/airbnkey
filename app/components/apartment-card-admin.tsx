"use client"

import Image from "next/image"

import type { Apartment } from "@/types/apartments"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type ApartmentCardAdminProps = {
  apartment: Apartment
  onEdit: () => void
  onDelete: () => void
}

export function ApartmentCardAdmin({
  apartment,
  onEdit,
  onDelete,
}: ApartmentCardAdminProps) {
  const firstImage = apartment.images[0]
  const unoptimized =
    firstImage?.startsWith("blob:") || firstImage?.startsWith("data:")

  const advantages = apartment.advantages ?? []
  const visibleAdvantages = advantages.slice(0, 3)
  const extraAdvantages = Math.max(0, advantages.length - 3)

  return (
    <div className="h-full pt-3 pr-3">
      <Card className="group mx-0 h-full overflow-visible rounded-xl border-white/10 bg-white/70 p-0 shadow-sm backdrop-blur-md transition-all duration-200 ease-out hover:shadow-md">
        <div className="relative w-full">
          <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
            <Image
              src={firstImage}
              alt={apartment.title}
              fill
              className="h-full w-full object-cover transition-[filter] duration-300 ease-out group-hover:brightness-[1.02]"
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              // Adapter pour blob/data: si l’admin supprime des images, elles peuvent être des ObjectURL.
              unoptimized={unoptimized ?? false}
              priority={false}
            />
          </div>
          <button
            type="button"
            aria-label="Supprimer cet appartement"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="absolute right-0 top-0 z-30 inline-flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/14 bg-white/86 text-neutral-900 shadow-[0_4px_14px_rgba(0,0,0,0.16),0_2px_6px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-200 ease-out hover:border-red-500/40 hover:bg-red-500/88 hover:text-white hover:shadow-[0_6px_22px_rgba(0,0,0,0.18),0_3px_10px_rgba(220,38,38,0.3)] active:scale-[0.96] focus-visible:border-red-500/40 focus-visible:bg-red-500/88 focus-visible:outline-none focus-visible:text-white focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:shadow-[0_6px_22px_rgba(0,0,0,0.16),0_3px_10px_rgba(220,38,38,0.22)] dark:border-white/22 dark:bg-black/62 dark:text-white dark:hover:border-red-400/45 dark:hover:bg-red-500/82 dark:hover:text-white dark:focus-visible:border-red-400/45 dark:focus-visible:bg-red-500/82 dark:focus-visible:ring-red-400/48"
          >
            <X
              className="size-5 shrink-0 transition-colors duration-200 ease-out"
              aria-hidden
              strokeWidth={2}
            />
          </button>
        </div>

        <CardContent className="space-y-2 p-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
              {apartment.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {apartment.beds} lits · {apartment.bathrooms} SDB
            </p>
          </div>

          {visibleAdvantages.length > 0 ? (
            <div className="flex min-h-[1.25rem] flex-wrap gap-1">
              {visibleAdvantages.map((advantage) => (
                <Badge
                  key={advantage}
                  variant="secondary"
                  className="max-w-[100%] truncate bg-muted/60 py-0.5 px-2 text-[10px] font-normal leading-tight"
                >
                  {advantage}
                </Badge>
              ))}
              {extraAdvantages > 0 ? (
                <Badge
                  variant="outline"
                  className="shrink-0 py-0.5 px-2 text-[10px] font-normal leading-tight text-muted-foreground"
                >
                  +{extraAdvantages}
                </Badge>
              ) : null}
            </div>
          ) : null}

          <div className="min-w-0 pt-0.5">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onEdit}
              className="w-full rounded-lg border border-orange-500/20 bg-orange-500/15 text-orange-600 shadow-sm hover:bg-orange-500/20 active:scale-[0.99] dark:text-orange-300 dark:hover:bg-orange-500/20"
            >
              Modifier
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

