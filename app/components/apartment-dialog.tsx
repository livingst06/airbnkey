"use client"

import { type ComponentPropsWithoutRef } from "react"

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

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
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
