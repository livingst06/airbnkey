"use client"

import { useState } from "react"
import Image from "next/image"
import { Apartment } from "@/types/apartments"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ApartmentDialog } from "./apartment-dialog"

type Props = {
  apartment: Apartment
  priority?: boolean
}

export function ApartmentCard({ apartment, priority = false }: Props) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Card
        className="group overflow-hidden cursor-pointer hover:shadow-lg transition-transform duration-200 hover:-translate-y-1"
        onClick={() => setIsOpen(true)}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
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
        </CardContent>
      </Card>

      <ApartmentDialog
        apartment={apartment}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </>
  )
}