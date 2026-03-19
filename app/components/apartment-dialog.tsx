"use client"

import { Apartment } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <ApartmentCarousel images={images} title={apartment.title} />

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

