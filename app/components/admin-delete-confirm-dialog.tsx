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
import { Loader2, XIcon } from "lucide-react"
import { APARTMENT_CHARACTERISTIC_LABELS } from "@/lib/apartment-field-labels"

import { useMemo } from "react"

type AdminDeleteConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  apartment: Apartment | null
  onConfirm: () => void | Promise<void>
  isDeleting: boolean
}

export function AdminDeleteConfirmDialog({
  open,
  onOpenChange,
  apartment,
  onConfirm,
  isDeleting,
}: AdminDeleteConfirmDialogProps) {
  const resolvedOpen = open && apartment !== null
  const firstImage = apartment ? getApartmentImageSrc(apartment.images) : undefined
  const unoptimized = useMemo(
    () => imageNeedsUnoptimized(firstImage),
    [firstImage],
  )

  return (
    <Dialog
      open={resolvedOpen}
      onOpenChange={(nextOpen) => {
        if (isDeleting) return
        onOpenChange(nextOpen)
      }}
    >
      {apartment ? (
        <DialogContent
          showCloseButton={false}
          aria-busy={isDeleting}
          className="flex max-w-2xl flex-col overflow-hidden rounded-3xl border border-border/70 bg-card/95 p-0 shadow-[0_26px_58px_rgba(16,18,24,0.22)] ring-0 transition-colors duration-300"
        >
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              disabled={isDeleting}
              className="absolute right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/82 shadow-sm backdrop-blur transition-colors duration-200 ease-out hover:bg-muted/70 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <XIcon className="size-4 opacity-90" />
            </button>
          </DialogClose>

          <div className="no-scrollbar flex-1 overflow-y-auto p-6 md:p-8">
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
                Delete this apartment?
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                This action is permanent.
              </DialogDescription>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border/65 bg-muted/25 backdrop-blur-md">
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
                  {apartment.beds} {APARTMENT_CHARACTERISTIC_LABELS.beds.toLowerCase()} • {apartment.bathrooms} {APARTMENT_CHARACTERISTIC_LABELS.bathrooms.toLowerCase()}
                </div>
                {apartment.advantages?.length ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {apartment.advantages.slice(0, 4).map((adv, idx) => (
                      <span
                        key={`adv-${idx}-${adv}`}
                        className="rounded-full border border-border/60 bg-muted/55 px-3 py-1 text-xs font-medium text-muted-foreground"
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
                  disabled={isDeleting}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                disabled={isDeleting}
                className="rounded-xl"
                onClick={() => {
                  void onConfirm()
                }}
              >
                {isDeleting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete permanently"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}

