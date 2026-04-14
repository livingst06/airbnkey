"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import { useCallback, useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import Image from "next/image"
import type { Apartment, DialogAnchorRect } from "@/types/apartments"
import type { HoverSource } from "@/types/hover"
import { getApartmentImageSrc } from "@/lib/image-src"
import { getMapStyleUrl } from "@/lib/map-style"
/** Délai avant fermeture : évite les boucles enter/leave au moindre pixel si l’état était vidé tout de suite. */
const MAP_POPUP_HOVER_LEAVE_MS = 280
const MOBILE_SCROLL_FREEZE_DEBOUNCE_MS = 140

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

type FreezeMarkerSnapshot = {
  id: string
  html: string
  left: number
  top: number
  width: number
  height: number
}

type FreezeDomSnapshot = {
  id: string
  html: string
  left: number
  top: number
  width: number
  height: number
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
  "relative z-[1] inline-flex items-center justify-center min-w-[56px] h-7 max-lg:min-h-8 px-2 rounded-full border border-transparent shadow-sm transition-all duration-300 hover:shadow-md"
const MARKER_SELECTED_CLASS =
  "shadow-lg"
const MARKER_SELECTED_TOKENS = MARKER_SELECTED_CLASS.split(" ")
/** Emphase sync hover : uniquement sur inner (scale autorisé) */
const MARKER_HOVER_EMPHASIS_CLASS =
  "scale-[1.2] shadow-md"
const MARKER_HOVER_EMPHASIS_TOKENS = MARKER_HOVER_EMPHASIS_CLASS.split(" ")

const MARKER_IDLE_BG = "#e5e7eb"
const MARKER_IDLE_TEXT = "#000000"
const MARKER_IDLE_BORDER = "transparent"
const MARKER_ACTIVE_BG = "#000000"
const MARKER_ACTIVE_TEXT = "#ffffff"
const MARKER_ACTIVE_BORDER = "#000000"

function canUseMapHoverInteractions() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches
}

function shouldOpenDialogFromMap() {
  return canUseMapHoverInteractions()
}

function shouldTrackViewportResizes() {
  return canUseMapHoverInteractions()
}

function isTouchDeviceMapMode() {
  return !canUseMapHoverInteractions()
}

function applyMarkerVisualState(inner: HTMLElement, active: boolean) {
  if (active) {
    inner.style.backgroundColor = MARKER_ACTIVE_BG
    inner.style.color = MARKER_ACTIVE_TEXT
    inner.style.borderColor = MARKER_ACTIVE_BORDER
    return
  }

  inner.style.backgroundColor = MARKER_IDLE_BG
  inner.style.color = MARKER_IDLE_TEXT
  inner.style.borderColor = MARKER_IDLE_BORDER
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
  const [freezeImageUrl, setFreezeImageUrl] = useState<string | null>(null)
  const [freezeMarkers, setFreezeMarkers] = useState<FreezeMarkerSnapshot[]>([])
  const [freezeDomOverlays, setFreezeDomOverlays] = useState<FreezeDomSnapshot[]>(
    [],
  )
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
  const lastResizeSizeRef = useRef<{ width: number; height: number } | null>(null)
  const scrollFreezeTimerRef = useRef<number | null>(null)
  const isMobileScrollFrozenRef = useRef(false)

  const closeAllPopups = useCallback(() => {
    for (const slot of Object.values(markersByIdRef.current)) {
      try {
        slot.popup.remove()
      } catch {
        // noop
      }
    }
  }, [])

  const clearMapHoverLeaveTimer = useCallback(() => {
    if (mapHoverLeaveTimerRef.current != null) {
      window.clearTimeout(mapHoverLeaveTimerRef.current)
      mapHoverLeaveTimerRef.current = null
    }
  }, [])

  const clearScrollFreezeTimer = useCallback(() => {
    if (scrollFreezeTimerRef.current != null) {
      window.clearTimeout(scrollFreezeTimerRef.current)
      scrollFreezeTimerRef.current = null
    }
  }, [])

  const releaseMobileScrollFreeze = useCallback(() => {
    clearScrollFreezeTimer()
    isMobileScrollFrozenRef.current = false
    setFreezeImageUrl(null)
    setFreezeMarkers([])
    setFreezeDomOverlays([])
  }, [clearScrollFreezeTimer])

  const freezeMapDuringMobileScroll = useCallback(() => {
    if (!isTouchDeviceMapMode()) return

    const container = mapContainerRef.current
    const canvas = container?.querySelector("canvas")
    if (!(container instanceof HTMLDivElement) || !(canvas instanceof HTMLCanvasElement)) {
      return
    }

    if (!isMobileScrollFrozenRef.current) {
      isMobileScrollFrozenRef.current = true
      try {
        setFreezeImageUrl(canvas.toDataURL("image/png"))
      } catch {
        setFreezeImageUrl(null)
      }

      const containerRect = container.getBoundingClientRect()
      const markerSnapshots = Object.entries(markersByIdRef.current).map(
        ([id, slot]) => {
          const rect = slot.root.getBoundingClientRect()
          return {
            id,
            html: slot.root.innerHTML,
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          }
        },
      )
      setFreezeMarkers(markerSnapshots)

      const domSnapshotTargets = [
        {
          selector: ".maplibregl-ctrl-bottom-right",
          getHtml: (element: HTMLElement) => element.innerHTML,
        },
        {
          selector: ".maplibregl-popup .popup-card",
          getHtml: (element: HTMLElement) => element.outerHTML,
        },
      ] as const
      const domSnapshots = domSnapshotTargets.flatMap(({ selector, getHtml }, index) =>
        Array.from(container.querySelectorAll(selector)).map((node, nodeIndex) => {
          const element = node instanceof HTMLElement ? node : null
          if (!element) return []
          const rect = element.getBoundingClientRect()
          return {
            id: `${selector}-${index}-${nodeIndex}`,
            html: getHtml(element),
            left: rect.left - containerRect.left,
            top: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          }
        }),
      )
      setFreezeDomOverlays(domSnapshots.flat())
    }

    clearScrollFreezeTimer()
    scrollFreezeTimerRef.current = window.setTimeout(() => {
      scrollFreezeTimerRef.current = null
      isMobileScrollFrozenRef.current = false
      setFreezeImageUrl(null)
    }, MOBILE_SCROLL_FREEZE_DEBOUNCE_MS)
  }, [clearScrollFreezeTimer])

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
    applyMarkerVisualState(inner, false)
    inner.innerHTML = `<span class="text-[12px] font-semibold leading-none">${price}€</span>`
    el.appendChild(inner)

    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 16,
      className: "custom-popup",
    })

    const bedLabel = apartment.beds === 1 ? "bed" : "beds"
    const bathroomLabel = apartment.bathrooms === 1 ? "bathroom" : "bathrooms"
    const meta = `${apartment.beds} ${bedLabel} • ${apartment.bathrooms} ${bathroomLabel}`
    const firstImage = getApartmentImageSrc(apartment.images)
    const popupContent = document.createElement("div")
    popupContent.className = "popup-card cursor-pointer"
    popupContent.innerHTML = `
      <img
        src="${firstImage}"
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
      if (canUseMapHoverInteractions()) {
        setSelectedApartmentId(apartment.id)
      }
      if (shouldOpenDialogFromMap()) {
        openApartmentDialog(apartment.id, mapPinAnchorFromMarkerRoot(el))
        popup.remove()
      }
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
      if (canUseMapHoverInteractions()) {
        setSelectedApartmentId(apartment.id)
      }
      if (shouldOpenDialogFromMap()) {
        openApartmentDialog(apartment.id, mapPinAnchorFromMarkerRoot(el))
        popup.remove()
        return
      }
      closeAllPopups()
      popup.setLngLat([apartment.longitude, apartment.latitude])
      popup.addTo(map)
    })

    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        e.stopPropagation()
        clearMapHoverLeaveTimer()
        openApartmentDialog(apartment.id, mapPinAnchorFromMarkerRoot(el))
        if (canUseMapHoverInteractions()) {
          setSelectedApartmentId(apartment.id)
        }
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
      closeAllPopups,
      openApartmentDialog,
      setSelectedApartmentId,
      setHoveredApartmentId,
      setHoverSource,
      setHoverLock,
    ],
  )

  useEffect(() => {
    apartmentsForMapInitRef.current = apartments
  }, [apartments])

  useEffect(() => {
    const container = mapContainerRef.current
    if (!container) return

    let cancelled = false
    let rafId = 0
    let retryTimeoutId: number | null = null
    let layoutWaitFrames = 0
    const MAX_LAYOUT_WAIT_FRAMES = 90

    const scheduleResize = () => {
      requestAnimationFrame(() => {
        if (cancelled) return
        const currentMap = mapRef.current
        if (!currentMap) return
        const currentContainer = currentMap.getContainer()
        const nextSize = {
          width: currentContainer.clientWidth,
          height: currentContainer.clientHeight,
        }
        const prevSize = lastResizeSizeRef.current
        if (
          prevSize &&
          prevSize.width === nextSize.width &&
          prevSize.height === nextSize.height
        ) {
          return
        }
        lastResizeSizeRef.current = nextSize
        currentMap.resize()
      })
    }

    const onViewportResize = () => scheduleResize()

    const tryInitMap = () => {
      if (cancelled) return
      if (mapRef.current) return

      const list = apartmentsForMapInitRef.current
      if (!list.length) {
        if (retryTimeoutId != null) {
          window.clearTimeout(retryTimeoutId)
        }
        // Avoid a per-frame retry loop when filters currently hide all apartments.
        retryTimeoutId = window.setTimeout(tryInitMap, 250)
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
        canvasContextAttributes: isTouchDeviceMapMode()
          ? { preserveDrawingBuffer: true }
          : undefined,
      })

      const bounds = new maplibregl.LngLatBounds()

      map.on("load", () => {
        lastResizeSizeRef.current = {
          width: container.clientWidth,
          height: container.clientHeight,
        }
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

      map.on("click", () => {
        if (shouldOpenDialogFromMap()) return
        closeAllPopups()
      })

      mapRef.current = map

      mapResizeObserverRef.current?.disconnect()
      if (shouldTrackViewportResizes()) {
        mapResizeObserverRef.current = new ResizeObserver(() => {
          scheduleResize()
        })
        mapResizeObserverRef.current.observe(container)
      }

      mapIntersectionObserverRef.current?.disconnect()
      mapIntersectionObserverRef.current = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && shouldTrackViewportResizes()) scheduleResize()
            else if (!shouldOpenDialogFromMap()) closeAllPopups()
          }
        },
        { threshold: 0 },
      )
      mapIntersectionObserverRef.current.observe(container)

      if (shouldTrackViewportResizes()) {
        window.addEventListener("resize", onViewportResize)
        window.visualViewport?.addEventListener("resize", onViewportResize)
      }
      window.addEventListener("orientationchange", onViewportResize)

      list.forEach((apartment) => {
        bounds.extend([apartment.longitude, apartment.latitude])
        createMarkerForApartment(apartment, map)
      })
    }

    rafId = requestAnimationFrame(tryInitMap)

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      if (retryTimeoutId != null) {
        window.clearTimeout(retryTimeoutId)
      }
      mapIntersectionObserverRef.current?.disconnect()
      mapIntersectionObserverRef.current = null
      if (shouldTrackViewportResizes()) {
        window.removeEventListener("resize", onViewportResize)
        window.visualViewport?.removeEventListener("resize", onViewportResize)
      }
      window.removeEventListener("orientationchange", onViewportResize)
      mapResizeObserverRef.current?.disconnect()
      mapResizeObserverRef.current = null
      if (mapHoverLeaveTimerRef.current != null) {
        window.clearTimeout(mapHoverLeaveTimerRef.current)
        mapHoverLeaveTimerRef.current = null
      }
      clearScrollFreezeTimer()
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      lastResizeSizeRef.current = null
      markersByIdRef.current = {}
      previousHoveredIdRef.current = null
      isMobileScrollFrozenRef.current = false
    }
  }, [clearScrollFreezeTimer, closeAllPopups, createMarkerForApartment])

  useEffect(() => {
    if (!isTouchDeviceMapMode()) return

    const handleScroll = () => {
      freezeMapDuringMobileScroll()
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      releaseMobileScrollFreeze()
    }
  }, [freezeMapDuringMobileScroll, releaseMobileScrollFreeze])

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
      const isHovered = hoveredId !== null && id === hoveredId
      for (const token of MARKER_SELECTED_TOKENS) {
        slot.inner.classList.toggle(token, isSelected)
      }
      applyMarkerVisualState(slot.inner, isSelected || isHovered)

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
    const hoveredId = hoveredApartmentIdRef.current

    for (const [id, slot] of Object.entries(markersById)) {
      const { inner } = slot
      const isSelected = id === selectedApartmentId
      const isHovered = hoveredId !== null && id === hoveredId
      for (const token of MARKER_SELECTED_TOKENS) {
        inner.classList.toggle(token, isSelected)
      }
      applyMarkerVisualState(inner, isSelected || isHovered)
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
      applyMarkerVisualState(inner, id === selectedApartmentIdRef.current)
      inner.style.zIndex = ""
    }

    const addEmphasis = (id: string) => {
      const slot = markersById[id]
      if (!slot) return
      const { inner } = slot
      for (const token of MARKER_HOVER_EMPHASIS_TOKENS) {
        inner.classList.add(token)
      }
      applyMarkerVisualState(inner, true)
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
    <div className="map-mobile-shell relative h-full min-h-0 w-full overflow-hidden bg-white dark:bg-neutral-800">
      <div
        ref={mapContainerRef}
        className="map-mobile-surface h-full w-full min-h-0"
      />
      {freezeImageUrl ? (
        <div className="map-mobile-freeze-overlay pointer-events-none absolute inset-0 z-20">
          <Image
            src={freezeImageUrl}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="object-cover"
          />
          {freezeMarkers.map((marker) => (
            <div
              key={marker.id}
              className="absolute"
              style={{
                left: marker.left,
                top: marker.top,
                width: marker.width,
                height: marker.height,
              }}
              dangerouslySetInnerHTML={{ __html: marker.html }}
            />
          ))}
          {freezeDomOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className="absolute"
              style={{
                left: overlay.left,
                top: overlay.top,
                width: overlay.width,
                height: overlay.height,
              }}
              dangerouslySetInnerHTML={{ __html: overlay.html }}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
