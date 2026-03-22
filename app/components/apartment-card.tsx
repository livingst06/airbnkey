"use client"

import Image from "next/image"
import Link from "next/link"
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
}

export function ApartmentCard({
  apartment,
  priority = false,
  selectedApartmentId,
  dialogApartmentId,
  setDialogApartmentId,
}: Props) {
  const isSelected = selectedApartmentId === apartment.id

  return (
    <>
      <Card
        className={`group cursor-pointer overflow-hidden transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md ${
          isSelected ? "ring-2 ring-primary" : ""
        }`}
        onClick={() => setDialogApartmentId(apartment.id)}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl">
          <Image
            src={apartment.images[0]}
            alt={apartment.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
          />
        </div>

        <CardContent className="p-4">
          <h3 className="font-semibold">{apartment.title}</h3>

          <p className="text-sm text-muted-foreground">
            {apartment.beds} couchages • {apartment.bathrooms} salle de bain
          </p>

          {apartment.advantages?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {apartment.advantages.map((advantage: string) => (
                <Badge key={advantage} variant="secondary">
                  {advantage}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="mt-3">
            <Link
              href={`/appartement/${apartment.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex rounded-xl bg-primary/5 px-4 py-2 text-sm font-medium text-primary shadow-sm transition-all duration-200 ease-out hover:bg-primary/10 hover:shadow-md hover:-translate-y-0.5 active:scale-95 active:shadow-sm"
            >
              Voir les détails
            </Link>
          </div>
        </CardContent>
      </Card>

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