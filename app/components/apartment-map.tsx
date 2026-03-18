"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import type { Apartment } from "@/types/apartments"

const MAP_STYLE_URL = "https://demotiles.maplibre.org/style.json"

type ApartmentMapProps = {
  apartments: Apartment[]
  selectedApartmentId: string | null
  dialogApartmentId: string | null
  setSelectedApartmentId: (id: string | null) => void
  setDialogApartmentId: (id: string | null) => void
}

const MARKER_BASE_CLASS =
  "inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary/70 border border-background shadow-sm cursor-pointer transition-colors"
const MARKER_SELECTED_CLASS = "bg-primary border-primary shadow-md"
const MARKER_SELECTED_TOKENS = MARKER_SELECTED_CLASS.split(" ")

export function ApartmentMap({
  apartments,
  selectedApartmentId,
  setSelectedApartmentId,
  setDialogApartmentId,
}: ApartmentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersByIdRef = useRef<Record<string, maplibregl.Marker>>({})

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

      const bounds = new maplibregl.LngLatBounds()

      map.on("load", () => {
        map.resize()

        if (apartments.length > 1) {
          map.fitBounds(bounds, { padding: 80, maxZoom: 15 })
        }
      })

      mapRef.current = map

      apartments.forEach((apartment) => {
        bounds.extend([apartment.longitude, apartment.latitude])
        const el = document.createElement("button")
        el.type = "button"
        el.tabIndex = 0
        el.setAttribute("aria-label", apartment.title)
        el.className = MARKER_BASE_CLASS

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 25,
          // Les popups MapLibre doivent être cliquables ; on force un contenu "pointer-friendly".
          className: "airbnb-popup",
        })

        const popupContent = document.createElement("div")
        popupContent.className =
          "w-[200px] overflow-hidden rounded-xl border bg-background shadow-lg cursor-pointer"
        popupContent.innerHTML = `
          <img
            src="${apartment.images[0]}"
            alt="${apartment.title.replaceAll('"', "&quot;")}"
            class="h-[120px] w-full object-cover"
          />
          <div class="p-3 space-y-1">
            <div class="font-semibold leading-tight">${apartment.title}</div>
            <div class="text-sm text-muted-foreground">
              ${apartment.beds} couchages • ${apartment.bathrooms} salle de bain
            </div>
          </div>
        `

        let hideTimer: number | null = null

        popupContent.addEventListener("mouseenter", () => {
          if (hideTimer) window.clearTimeout(hideTimer)
          hideTimer = null
        })

        popupContent.addEventListener("mouseleave", () => {
          if (hideTimer) window.clearTimeout(hideTimer)
          hideTimer = window.setTimeout(() => {
            popup.remove()
          }, 120)
        })

        popupContent.addEventListener("click", (e) => {
          e.stopPropagation()
          setDialogApartmentId(apartment.id)
          setSelectedApartmentId(apartment.id)
          popup.remove()
        })

        popup.setDOMContent(popupContent)

        el.addEventListener("mouseenter", () => {
          setSelectedApartmentId(apartment.id)
          if (hideTimer) window.clearTimeout(hideTimer)
          hideTimer = null

          // Le popup doit avoir une position valide au moment de l’affichage.
          const m = mapRef.current
          if (!m) return
          popup.setLngLat([apartment.longitude, apartment.latitude])
          popup.addTo(m)
        })
        el.addEventListener("mouseleave", () => {
          setSelectedApartmentId(null)
          if (hideTimer) window.clearTimeout(hideTimer)
          hideTimer = window.setTimeout(() => {
            popup.remove()
          }, 120)
        })

        el.addEventListener("click", (e) => {
          e.stopPropagation()
          setDialogApartmentId(apartment.id)
          setSelectedApartmentId(apartment.id)
          popup.remove()
        })

        el.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            e.stopPropagation()
            setDialogApartmentId(apartment.id)
            setSelectedApartmentId(apartment.id)
          }
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([apartment.longitude, apartment.latitude])
          .setPopup(popup)
          .addTo(map)

        markersByIdRef.current[apartment.id] = marker
      })

    })

    return () => {
      cancelAnimationFrame(frameId)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const markersById = markersByIdRef.current

    for (const [id, marker] of Object.entries(markersById)) {
      const element = marker.getElement()
      const isSelected = id === selectedApartmentId

      // Highlight uniquement via classes CSS, sans toucher à la position du marker.
      for (const token of MARKER_SELECTED_TOKENS) {
        element.classList.toggle(token, isSelected)
      }
    }
  }, [selectedApartmentId])

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-xl border">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}

