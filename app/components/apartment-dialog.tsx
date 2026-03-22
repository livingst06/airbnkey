"use client"

import { Apartment } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import { XIcon } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApartmentCarousel } from "./apartment-carousel"

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-xl ring-0 dark:bg-white"
      >
        <DialogClose
          aria-label="Fermer"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition-all duration-200 ease-out hover:bg-white"
        >
          <XIcon className="size-4 opacity-90" />
        </DialogClose>

        <ApartmentCarousel
          variant="dialog"
          images={images}
          title={apartment.title}
          slug={apartment.slug}
        />

        <div className="space-y-6 p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg">{apartment.title}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {apartment.beds} couchages • {apartment.bathrooms} salle
              {apartment.bathrooms > 1 ? "s" : ""} de bain
            </p>
          </DialogHeader>

          <DialogDescription className="text-sm leading-relaxed text-foreground">
            {apartment.description}
          </DialogDescription>

          {apartment.advantages?.length ? (
            <div className="flex flex-wrap gap-2 pt-1">
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

