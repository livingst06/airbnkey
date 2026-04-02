"use client"

import type { Apartment } from "@/types/apartments"
import type { HoverSource } from "@/types/hover"
import { ApartmentCard } from "./apartment-card"

type ApartmentCardPublicProps = {
  apartment: Apartment
  index: number
  selectedApartmentId: string | null
  hoveredApartmentId: string | null
  hoverSource: HoverSource
}

export function ApartmentCardPublic({
  apartment,
  index,
  selectedApartmentId,
  hoveredApartmentId,
  hoverSource,
}: ApartmentCardPublicProps) {
  return (
    <ApartmentCard
      apartment={apartment}
      priority={index === 0}
      selectedApartmentId={selectedApartmentId}
      hoveredApartmentId={hoveredApartmentId}
      hoverSource={hoverSource}
      layout="desktopSplit"
      titleIdPrefix="apt-card-title"
    />
  )
}
