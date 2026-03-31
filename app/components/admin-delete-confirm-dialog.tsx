"use client"

import Image from "next/image"

import { getApartmentImageSrc, imageNeedsUnoptimized } from "@/lib/image-src"
import type { Apartment } from "@/types/apartments"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { XIcon } from "lucide-react"

import { useMemo } from "react"

type AdminDeleteConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  apartment: Apartment | null
  onConfirm: () => void
}

export function AdminDeleteConfirmDialog({
  open,
  onOpenChange,
  apartment,
  onConfirm,
}: AdminDeleteConfirmDialogProps) {
  const firstImage = apartment ? getApartmentImageSrc(apartment.images) : undefined
  const unoptimized = useMemo(
    () => imageNeedsUnoptimized(firstImage),
    [firstImage],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {apartment ? (
        <DialogContent
          showCloseButton={false}
          className="flex max-w-2xl flex-col overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-xl ring-0 transition-colors duration-300 dark:bg-neutral-800"
        >
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Fermer"
              className="absolute right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition-all duration-200 ease-out hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/90"
            >
              <XIcon className="size-4 opacity-90" />
            </button>
          </DialogClose>

          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Supprimer cet appartement ?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Cette action est définitive.
              </DialogDescription>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/60 backdrop-blur-md">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={firstImage ?? getApartmentImageSrc([])}
                  alt={apartment.title}
                  fill
                  sizes="(min-width: 768px) 672px, calc(100vw - 3rem)"
                  unoptimized={unoptimized}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-1 p-4">
                <div className="text-lg font-semibold tracking-tight">
                  {apartment.title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {apartment.beds} couchages • {apartment.bathrooms} salle de bain
                </div>
                {apartment.advantages?.length ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {apartment.advantages.slice(0, 4).map((adv, idx) => (
                      <span
                        key={`adv-${idx}-${adv}`}
                        className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {adv}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                >
                  Annuler
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                className="rounded-xl"
                onClick={() => {
                  onConfirm()
                }}
              >
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

