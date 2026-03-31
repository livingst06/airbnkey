"use client"

import { useCallback, useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import type { Apartment, DialogAnchorRect } from "@/types/apartments"
import type { HoverSource } from "@/types/hover"
import { getMapStyleUrl } from "@/lib/map-style"
/** Délai avant fermeture : évite les boucles enter/leave au moindre pixel si l’état était vidé tout de suite. */
const MAP_POPUP_HOVER_LEAVE_MS = 280

type ApartmentMapProps = {
  apartments: Apartment[]
  selectedApartmentId: string | null
  hoveredApartmentId: string | null
  hoverLock: boolean
  dialogApartmentId: string | null
  setSelectedApartmentId: (id: string | null) => void
  openApartmentDialog: (id: string | null, anchor?: DialogAnchorRect | null) => void
  setHoveredApartmentId: (id: string | null) => void
  setHoverSource: (source: HoverSource) => void
  setHoverLock: (locked: boolean) => void
}

type MarkerSlot = {
  marker: maplibregl.Marker
  popup: maplibregl.Popup
  root: HTMLElement
  inner: HTMLElement
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

/** Ancre modale côté carte : viewport du root du marker MapLibre, centrage horizontal sur le pin. */
function mapPinAnchorFromMarkerRoot(el: HTMLElement): DialogAnchorRect {
  const r = el.getBoundingClientRect()
  return {
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
    align: "center",
  }
}

function derivePriceFromApartment(apartment: Apartment) {
  // Prix dérivé simple (pas de champ `price` dans le modèle existant).
  // L'objectif ici est l'affichage visuel du marker, pas la tarification réelle.
  const base = 80
  return Math.round(base + apartment.beds * 25 + apartment.bathrooms * 15)
}

/** Root : aucune classe transform/scale — MapLibre garde translate(...) sur ce nœud */
const MARKER_ROOT_CLASS =
  "relative inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
/** Inner : apparence du pill + transitions (scale/hover emphasis uniquement ici) */
const MARKER_INNER_CLASS =
  "relative z-[1] inline-flex items-center justify-center min-w-[56px] h-7 max-lg:min-h-8 px-2 rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm transition-all duration-300 hover:shadow-md dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
const MARKER_SELECTED_CLASS =
  "ring-2 ring-primary border-primary shadow-lg"
const MARKER_SELECTED_TOKENS = MARKER_SELECTED_CLASS.split(" ")
/** Emphase sync hover : uniquement sur inner (scale autorisé) */
const MARKER_HOVER_EMPHASIS_CLASS =
  "scale-[1.2] border-primary bg-primary/15 text-primary shadow-md dark:bg-primary/20"
const MARKER_HOVER_EMPHASIS_TOKENS = MARKER_HOVER_EMPHASIS_CLASS.split(" ")

function canUseMapHoverInteractions() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches
}

export function ApartmentMap({
  apartments,
  selectedApartmentId,
  hoveredApartmentId,
  setSelectedApartmentId,
  openApartmentDialog,
  setHoveredApartmentId,
  setHoverSource,
  setHoverLock,
}: ApartmentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const mapResizeObserverRef = useRef<ResizeObserver | null>(null)
  const mapIntersectionObserverRef = useRef<IntersectionObserver | null>(null)
  /** Liste à jour pour l’init (effet carte en `[]` — évite de recréer la map au refetch). */
  const apartmentsForMapInitRef = useRef(apartments)
  const mapHoverLeaveTimerRef = useRef<number | null>(null)
  const markersByIdRef = useRef<Record<string, MarkerSlot>>({})
  const previousHoveredIdRef = useRef<string | null>(null)
  const lastFlyToIdRef = useRef<string | null>(null)
  const apartmentsByIdRef = useRef<Map<string, Apartment>>(new Map())
  const selectedApartmentIdRef = useRef<string | null>(selectedApartmentId)
  const hoveredApartmentIdRef = useRef<string | null>(hoveredApartmentId)

  const clearMapHoverLeaveTimer = useCallback(() => {
    if (mapHoverLeaveTimerRef.current != null) {
      window.clearTimeout(mapHoverLeaveTimerRef.current)
      mapHoverLeaveTimerRef.current = null
    }
  }, [])

  const createMarkerForApartment = useCallback(
    (
      apartment: Apartment,
      map: maplibregl.Map,
    ) => {
    const el = document.createElement("button")
    el.type = "button"
    el.tabIndex = 0

    const price = derivePriceFromApartment(apartment)
    el.setAttribute("aria-label", `${apartment.title} - ${price}€`)
    el.className = MARKER_ROOT_CLASS

    const inner = document.createElement("div")
    inner.className = MARKER_INNER_CLASS
    inner.innerHTML = `<span class="text-[12px] font-semibold leading-none">${price}€</span>`
    el.appendChild(inner)

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 16,
      className: "custom-popup",
    })

    const meta = `${apartment.beds} couchages • ${apartment.bathrooms} salle de bain`
    const popupContent = document.createElement("div")
    popupContent.className = "popup-card cursor-pointer"
    popupContent.innerHTML = `
      <img
        src="${apartment.images[0]}"
        alt="${escapeHtml(apartment.title)}"
        class="popup-image"
      />
      <div class="popup-body">
        <div class="popup-title">${escapeHtml(apartment.title)}</div>
        <div class="popup-meta">${escapeHtml(meta)}</div>
      </div>
    `

    const scheduleMapHoverLeave = () => {
      if (!canUseMapHoverInteractions()) return
      clearMapHoverLeaveTimer()
      mapHoverLeaveTimerRef.current = window.setTimeout(() => {
        mapHoverLeaveTimerRef.current = null
        setSelectedApartmentId(null)
        setHoveredApartmentId(null)
        setHoverSource(null)
        setHoverLock(false)
        try {
          popup.remove()
        } catch {
          // noop
        }
      }, MAP_POPUP_HOVER_LEAVE_MS)
    }

    popupContent.addEventListener("mouseenter", () => {
      if (!canUseMapHoverInteractions()) return
      clearMapHoverLeaveTimer()
    })

    popupContent.addEventListener("mouseleave", () => {
      if (!canUseMapHoverInteractions()) return
      scheduleMapHoverLeave()
    })

    popupContent.addEventListener("click", (e) => {
      e.stopPropagation()
      clearMapHoverLeaveTimer()
      openApartmentDialog(apartment.id, mapPinAnchorFromMarkerRoot(el))
      setSelectedApartmentId(apartment.id)
      popup.remove()
    })

    popup.setDOMContent(popupContent)

    el.addEventListener("mouseenter", () => {
      if (!canUseMapHoverInteractions()) return
      clearMapHoverLeaveTimer()
      for (const [id, slot] of Object.entries(markersByIdRef.current)) {
        if (id === apartment.id) continue
        try {
          slot.popup.remove()
        } catch {
          // noop
        }
      }

      setSelectedApartmentId(apartment.id)
      setHoveredApartmentId(apartment.id)
      setHoverSource("map")
      setHoverLock(true)

      // Popup doit avoir une position valide au moment de l’affichage.
      popup.setLngLat([apartment.longitude, apartment.latitude])
      popup.addTo(map)
    })

    el.addEventListener("mouseleave", () => {
      if (!canUseMapHoverInteractions()) return
      scheduleMapHoverLeave()
    })

    el.addEventListener("click", (e) => {
      e.stopPropagation()
      clearMapHoverLeaveTimer()
      openApartmentDialog(apartment.id, mapPinAnchorFromMarkerRoot(el))
      setSelectedApartmentId(apartment.id)
      popup.remove()
    })

    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        e.stopPropagation()
        clearMapHoverLeaveTimer()
        openApartmentDialog(apartment.id, mapPinAnchorFromMarkerRoot(el))
        setSelectedApartmentId(apartment.id)
        popup.remove()
      }
    })

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([apartment.longitude, apartment.latitude])
      .setPopup(popup)
      .addTo(map)

    markersByIdRef.current[apartment.id] = {
      marker,
      popup,
      root: el,
      inner,
    }
    },
    [
      clearMapHoverLeaveTimer,
      openApartmentDialog,
      setSelectedApartmentId,
      setHoveredApartmentId,
      setHoverSource,
      setHoverLock,
    ],
  )

  apartmentsForMapInitRef.current = apartments

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let cancelled = false
    let rafId = 0
    let layoutWaitFrames = 0
    const MAX_LAYOUT_WAIT_FRAMES = 90

    const scheduleResize = () => {
      requestAnimationFrame(() => {
        if (!cancelled) mapRef.current?.resize()
      })
    }

    const onViewportResize = () => scheduleResize()

    const tryInitMap = () => {
      if (cancelled) return
      if (mapRef.current) return

      const list = apartmentsForMapInitRef.current
      if (!list.length) {
        rafId = requestAnimationFrame(tryInitMap)
        return
      }

      const cw = container.clientWidth
      const ch = container.clientHeight
      if ((cw < 2 || ch < 2) && layoutWaitFrames < MAX_LAYOUT_WAIT_FRAMES) {
        layoutWaitFrames += 1
        rafId = requestAnimationFrame(tryInitMap)
        return
      }

      const first = list[0]
      const map = new maplibregl.Map({
        container,
        style: getMapStyleUrl(),
        center: [first.longitude, first.latitude],
        zoom: 13,
      })

      const bounds = new maplibregl.LngLatBounds()

      map.on("load", () => {
        scheduleResize()
        /* Mobile : barre URL / layout ; double resize après paint pour éviter canvas 0×0. */
        requestAnimationFrame(() => {
          map.resize()
          requestAnimationFrame(() => map.resize())
        })
        window.setTimeout(() => map.resize(), 300)

        if (list.length > 1) {
          map.fitBounds(bounds, { padding: 80, maxZoom: 15 })
        }
      })

      mapRef.current = map

      mapResizeObserverRef.current?.disconnect()
      mapResizeObserverRef.current = new ResizeObserver(() => {
        mapRef.current?.resize()
      })
      mapResizeObserverRef.current.observe(container)

      mapIntersectionObserverRef.current?.disconnect()
      mapIntersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) scheduleResize()
          }
        },
        { threshold: 0 },
      )
      mapIntersectionObserverRef.current.observe(container)

      window.addEventListener("resize", onViewportResize)
      window.addEventListener("orientationchange", onViewportResize)
      window.visualViewport?.addEventListener("resize", onViewportResize)

      list.forEach((apartment) => {
        bounds.extend([apartment.longitude, apartment.latitude])
        createMarkerForApartment(apartment, map)
      })
    }

    rafId = requestAnimationFrame(tryInitMap)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      mapIntersectionObserverRef.current?.disconnect()
      mapIntersectionObserverRef.current = null
      window.removeEventListener("resize", onViewportResize)
      window.removeEventListener("orientationchange", onViewportResize)
      window.visualViewport?.removeEventListener("resize", onViewportResize)
      mapResizeObserverRef.current?.disconnect()
      mapResizeObserverRef.current = null
      if (mapHoverLeaveTimerRef.current != null) {
        window.clearTimeout(mapHoverLeaveTimerRef.current)
        mapHoverLeaveTimerRef.current = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      markersByIdRef.current = {}
      previousHoveredIdRef.current = null
    }
    // Carte : une instance ; markers mis à jour par l’effet dédié.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    apartmentsByIdRef.current = new Map(apartments.map((a) => [a.id, a]))
  }, [apartments])

  // Sync des markers uniquement quand la liste d’appartements change.
  // On ne recrée JAMAIS l’instance MapLibre (mapRef reste stable).
  useEffect(() => {
    const m = mapRef.current
    if (!m) return

    if (mapHoverLeaveTimerRef.current != null) {
      window.clearTimeout(mapHoverLeaveTimerRef.current)
      mapHoverLeaveTimerRef.current = null
    }

    // Supprimer markers + popups existants.
    const existing = markersByIdRef.current
    for (const slot of Object.values(existing)) {
      try {
        slot.popup.remove()
      } catch {
        // noop
      }
      try {
        slot.marker.remove()
      } catch {
        // noop
      }
    }
    markersByIdRef.current = {}

    apartments.forEach((apartment) => {
      createMarkerForApartment(apartment, m)
    })

    // Re-apply l’état courant (selection/hover) sur les nouveaux markers.
    const markersById = markersByIdRef.current
    const selectedId = selectedApartmentIdRef.current
    const hoveredId = hoveredApartmentIdRef.current

    for (const [id, slot] of Object.entries(markersById)) {
      const isSelected = id === selectedId
      for (const token of MARKER_SELECTED_TOKENS) {
        slot.inner.classList.toggle(token, isSelected)
      }

      for (const token of MARKER_HOVER_EMPHASIS_TOKENS) {
        slot.inner.classList.remove(token)
      }
      slot.inner.style.zIndex = ""

      if (hoveredId && id === hoveredId) {
        for (const token of MARKER_HOVER_EMPHASIS_TOKENS) {
          slot.inner.classList.add(token)
        }
        slot.inner.style.zIndex = "30"
      }
    }

    previousHoveredIdRef.current = hoveredId
  }, [apartments, createMarkerForApartment])

  useEffect(() => {
    selectedApartmentIdRef.current = selectedApartmentId
    const markersById = markersByIdRef.current

    for (const [id, slot] of Object.entries(markersById)) {
      const { inner } = slot
      const isSelected = id === selectedApartmentId
      for (const token of MARKER_SELECTED_TOKENS) {
        inner.classList.toggle(token, isSelected)
      }
    }
  }, [selectedApartmentId])

  useEffect(() => {
    hoveredApartmentIdRef.current = hoveredApartmentId
    const markersById = markersByIdRef.current
    const prevId = previousHoveredIdRef.current
    const nextId = hoveredApartmentId

    const clearEmphasis = (id: string) => {
      const slot = markersById[id]
      if (!slot) return
      const { inner } = slot
      for (const token of MARKER_HOVER_EMPHASIS_TOKENS) {
        inner.classList.remove(token)
      }
      inner.style.zIndex = ""
    }

    const addEmphasis = (id: string) => {
      const slot = markersById[id]
      if (!slot) return
      const { inner } = slot
      for (const token of MARKER_HOVER_EMPHASIS_TOKENS) {
        inner.classList.add(token)
      }
      inner.style.zIndex = "30"
    }

    if (prevId && prevId !== nextId) clearEmphasis(prevId)
    if (nextId && nextId !== prevId) addEmphasis(nextId)

    // Premium UX: when hovering a card in the list, subtly re-center the map on the pin.
    if (nextId && nextId !== prevId) {
      const m = mapRef.current
      if (m) {
        const apartment = apartmentsByIdRef.current.get(nextId)
        if (apartment && lastFlyToIdRef.current !== nextId) {
          const point = m.project([
            apartment.longitude,
            apartment.latitude,
          ])
          const container = m.getContainer()
          const width = container.clientWidth
          const height = container.clientHeight

          // Safe zone : on ne recadre que si le pin est trop proche des bords.
          const marginX = width * 0.2
          const marginY = height * 0.2
          const isInsideSafeZone =
            point.x > marginX &&
            point.x < width - marginX &&
            point.y > marginY &&
            point.y < height - marginY

          if (!isInsideSafeZone) {
            lastFlyToIdRef.current = nextId
            m.flyTo({
              center: [
                apartment.longitude,
                apartment.latitude,
              ],
              zoom: m.getZoom(), // important : pas de zoom auto
              duration: 600,
            })
          }
        }
      }
    }

    previousHoveredIdRef.current = nextId
  }, [hoveredApartmentId])

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-white dark:bg-neutral-800">
      <div ref={mapContainerRef} className="h-full w-full min-h-0" />
    </div>
  )
}
