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

function derivePriceFromApartment(apartment: Apartment) {
  // Prix dérivé simple (pas de champ `price` dans le modèle existant).
  // L'objectif ici est l'affichage visuel du marker, pas la tarification réelle.
  const base = 80
  return Math.round(base + apartment.beds * 25 + apartment.bathrooms * 15)
}

const MARKER_BASE_CLASS =
  "inline-flex items-center justify-center min-w-[56px] h-7 px-2 rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
const MARKER_SELECTED_CLASS =
  "ring-2 ring-primary border-primary shadow-lg"
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
        const price = derivePriceFromApartment(apartment)
        el.setAttribute(
          "aria-label",
          `${apartment.title} - ${price}€`,
        )
        el.className = MARKER_BASE_CLASS

        el.innerHTML = `<span class="text-[12px] font-semibold leading-none">${price}€</span>`

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 25,
          // Les popups MapLibre doivent être cliquables ; on force un contenu "pointer-friendly".
          className: "airbnb-popup",
        })

        const popupContent = document.createElement("div")
        popupContent.className =
          "w-[200px] overflow-hidden rounded-xl border border-neutral-200 bg-white/95 shadow-lg backdrop-blur-sm cursor-pointer dark:border-neutral-700 dark:bg-neutral-800/95"
        popupContent.innerHTML = `
          <img
            src="${apartment.images[0]}"
            alt="${apartment.title.replaceAll('"', "&quot;")}"
            class="h-[120px] w-full object-cover"
          />
          <div class="p-3 space-y-1">
            <div class="font-semibold leading-tight">${apartment.title}</div>
            <div class="text-sm text-neutral-500 dark:text-neutral-400">
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <div className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-800">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  )
}

