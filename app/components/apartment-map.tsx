"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import type { Apartment } from "@/types/apartments"

const MAP_STYLE_URL = "https://demotiles.maplibre.org/style.json"

type ApartmentMapProps = {
  apartments: Apartment[]
}

export function ApartmentMap({ apartments }: ApartmentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return
    if (mapRef.current) return
    if (!apartments.length) return

    const first = apartments[0]

    const frameId = requestAnimationFrame(() => {
      const map = new maplibregl.Map({
        container,
        style: MAP_STYLE_URL,
        center: [first.longitude, first.latitude],
        zoom: 13,
      })

      map.on("load", () => {
        map.resize()
      })

      apartments.forEach((apartment) => {
        new maplibregl.Marker()
          .setLngLat([apartment.longitude, apartment.latitude])
          .addTo(map)
      })

      mapRef.current = map
    })

    return () => {
      cancelAnimationFrame(frameId)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-xl border">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}

