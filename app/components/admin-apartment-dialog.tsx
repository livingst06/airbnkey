"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

import maplibregl from "maplibre-gl"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { XIcon } from "lucide-react"
import { toast } from "sonner"

import type { Apartment } from "@/types/apartments"
import { apartmentFormSchema } from "@/lib/apartment-zod"
import { imageNeedsUnoptimized } from "@/lib/image-src"
import { getMapStyleUrl } from "@/lib/map-style"
import { uploadImage } from "@/lib/upload-image"
import { useApartments } from "./apartments-context"

/** Délai après ouverture du dialog : l’anim zoom + layout doivent être stabilisés avant `new Map()`. */
const MINI_MAP_INIT_DELAY_MS = 200

const MAX_IMAGES = 8

function parseTags(tagsText: string): string[] {
  const parts = tagsText
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
  const seen = new Set<string>()
  const out: string[] = []
  for (const t of parts) {
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
    if (out.length >= 12) break
  }
  return out
}

function formatLatLng(value: number) {
  if (!Number.isFinite(value)) return 0
  return value
}

type AdminApartmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  apartment: Apartment | null
}

export function AdminApartmentDialog({
  open,
  onOpenChange,
  apartment,
}: AdminApartmentDialogProps) {
  const { addApartment, updateApartment } = useApartments()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [beds, setBeds] = useState(2)
  const [bathrooms, setBathrooms] = useState(1)
  const [tagsText, setTagsText] = useState("")
  const [latitude, setLatitude] = useState(43.5528)
  const [longitude, setLongitude] = useState(7.0174)
  const [images, setImages] = useState<string[]>([])
  const [bookingUrl, setBookingUrl] = useState("")
  const [imageImportBusy, setImageImportBusy] = useState(false)
  const imagesRef = useRef(images)
  imagesRef.current = images

  const latitudeRef = useRef(latitude)
  const longitudeRef = useRef(longitude)
  useEffect(() => {
    latitudeRef.current = latitude
  }, [latitude])
  useEffect(() => {
    longitudeRef.current = longitude
  }, [longitude])

  const committedRef = useRef(false)

  const miniMapContainerRef = useRef<HTMLDivElement | null>(null)
  const miniMapRef = useRef<maplibregl.Map | null>(null)
  const miniMarkerRef = useRef<maplibregl.Marker | null>(null)

  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  /** Après un drop, certains navigateurs déclenchent aussi un `click` sur la zone → doublon si on ouvre le file input. */
  const suppressPickerAfterDropRef = useRef(false)
  const suppressPickerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  )

  const unoptimizedForImages = useMemo(
    () => images.map((src) => imageNeedsUnoptimized(src)),
    [images],
  )

  useEffect(() => {
    if (!open) return

    committedRef.current = false

    if (apartment) {
      setTitle(apartment.title)
      setDescription(apartment.description)
      setBeds(apartment.beds)
      setBathrooms(apartment.bathrooms)
      setTagsText(apartment.advantages?.join(", ") ?? "")
      setLatitude(apartment.latitude)
      setLongitude(apartment.longitude)
      setImages([...apartment.images])
      setBookingUrl(apartment.bookingUrl?.trim() ? apartment.bookingUrl : "")
    } else {
      setTitle("")
      setDescription("")
      setBeds(2)
      setBathrooms(1)
      setTagsText("")
      setLatitude(43.5528)
      setLongitude(7.0174)
      setImages([])
      setBookingUrl("")
    }
  }, [open, apartment])

  useEffect(() => {
    if (open) return
    suppressPickerAfterDropRef.current = false
    if (suppressPickerTimeoutRef.current) {
      clearTimeout(suppressPickerTimeoutRef.current)
      suppressPickerTimeoutRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    let mapInstance: maplibregl.Map | null = null
    let resizeObserver: ResizeObserver | null = null
    const timerId = window.setTimeout(() => {
      if (cancelled) return
      const container = miniMapContainerRef.current
      if (!container || miniMapRef.current) return

      const map = new maplibregl.Map({
        container,
        style: getMapStyleUrl(),
        center: [longitudeRef.current, latitudeRef.current],
        zoom: 14,
      })

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")

      mapInstance = map
      miniMapRef.current = map

      const markerEl = document.createElement("div")
      markerEl.className =
        "relative h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50 bg-red-500 shadow-lg"
      markerEl.style.boxShadow = "0 10px 20px rgba(0,0,0,0.25)"

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([longitudeRef.current, latitudeRef.current])
        .addTo(map)
      miniMarkerRef.current = marker

      map.on("click", (e) => {
        setLongitude(e.lngLat.lng)
        setLatitude(e.lngLat.lat)
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat])
      })

      const onLoad = () => {
        map.resize()
      }
      map.on("load", onLoad)

      resizeObserver = new ResizeObserver(() => {
        map.resize()
      })
      resizeObserver.observe(container)
    }, MINI_MAP_INIT_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timerId)
      resizeObserver?.disconnect()
      resizeObserver = null
      if (mapInstance) {
        try {
          mapInstance.remove()
        } catch {
          /* noop */
        }
        mapInstance = null
      }
      miniMapRef.current = null
      miniMarkerRef.current = null
    }
  }, [open])

  useEffect(() => {
    const marker = miniMarkerRef.current
    if (!marker) return
    marker.setLngLat([longitude, latitude])
  }, [latitude, longitude])

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArr = Array.from(files)
    const room = Math.max(0, MAX_IMAGES - imagesRef.current.length)
    const toProcess = fileArr.slice(0, room)
    if (toProcess.length === 0) return

    void (async () => {
      setImageImportBusy(true)
      try {
        const urls: string[] = []
        for (const file of toProcess) {
          try {
            urls.push(await uploadImage(file))
          } catch {
            toast.error(`Image ignorée : ${file.name}`)
          }
        }
        if (urls.length === 0) return
        setImages((p) => [...p, ...urls])
      } finally {
        setImageImportBusy(false)
      }
    })()
  }

  const openFilePicker = () => {
    if (suppressPickerAfterDropRef.current) {
      suppressPickerAfterDropRef.current = false
      if (suppressPickerTimeoutRef.current) {
        clearTimeout(suppressPickerTimeoutRef.current)
        suppressPickerTimeoutRef.current = null
      }
      return
    }
    fileInputRef.current?.click()
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingImages(false)
    suppressPickerAfterDropRef.current = true
    if (suppressPickerTimeoutRef.current) {
      clearTimeout(suppressPickerTimeoutRef.current)
    }
    suppressPickerTimeoutRef.current = setTimeout(() => {
      suppressPickerAfterDropRef.current = false
      suppressPickerTimeoutRef.current = null
    }, 400)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (src: string) => {
    setImages((prev) => prev.filter((img) => img !== src))
  }

  const advantages = useMemo(() => parseTags(tagsText), [tagsText])

  const canSubmit = useMemo(() => {
    if (!title.trim()) return false
    if (!description.trim()) return false
    if (!images.length) return false
    if (!Number.isFinite(beds) || beds < 0) return false
    if (!Number.isFinite(bathrooms) || bathrooms < 0) return false
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false
    return true
  }, [title, description, images, beds, bathrooms, latitude, longitude])

  const submit = async () => {
    if (!canSubmit) return

    const input = {
      title: title.trim(),
      description: description.trim(),
      beds,
      bathrooms,
      advantages,
      latitude: formatLatLng(latitude),
      longitude: formatLatLng(longitude),
      images: [...images],
      bookingUrl: bookingUrl.trim() || undefined,
    } satisfies Parameters<typeof apartmentFormSchema.safeParse>[0]

    const parsed = apartmentFormSchema.safeParse(input)
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors
      const msg =
        fe.bookingUrl?.[0] ??
        fe.title?.[0] ??
        fe.images?.[0] ??
        "Données invalides"
      toast.error(msg)
      return
    }

    try {
      if (apartment) {
        await updateApartment(apartment.id, parsed.data)
      } else {
        await addApartment(parsed.data)
      }
      committedRef.current = true
      onOpenChange(false)
    } catch {
      // toasts déjà émis par le contexte
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,56rem)] w-[min(42rem,calc(100%-2rem))] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-xl ring-0 transition-colors duration-300 dark:bg-neutral-800 !translate-x-0 !translate-y-0 left-1/2 top-1/2 -ml-[min(21rem,calc(50vw-1rem))] -mt-[min(45dvh,28rem)] sm:-mt-[min(40dvh,24rem)]"
      >
        <DialogClose asChild>
          <button
            type="button"
            aria-label="Fermer"
            className="absolute right-4 top-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur transition-all duration-200 ease-out hover:bg-neutral-100 dark:bg-neutral-800/80 dark:hover:bg-neutral-700/90"
          >
            <XIcon className="size-4 opacity-90" />
          </button>
        </DialogClose>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
              {apartment ? "Modifier l’appartement" : "Ajouter un appartement"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {apartment
                ? "Mettez à jour les informations, les photos et la localisation."
                : "Créez un nouvel appartement en quelques minutes."}
            </DialogDescription>
          </div>

          <div className="space-y-6">
            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/60 p-4 backdrop-blur-md">
              <h3 className="text-base font-semibold tracking-tight">
                Infos principales
              </h3>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground/90">
                  Nom de l’appartement
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ex: Studio Croisette Vue Mer"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground/90">
                  Description
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez l’appartement..."
                  rows={4}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground/90">
                  Lien de réservation
                </label>
                <input
                  type="url"
                  value={bookingUrl}
                  onChange={(e) => setBookingUrl(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="https://..."
                />
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/60 p-4 backdrop-blur-md">
              <h3 className="text-base font-semibold tracking-tight">
                Caractéristiques
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground/90">
                    Couchages
                  </label>
                  <input
                    type="number"
                    value={beds}
                    onChange={(e) => setBeds(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground/90">
                    Salles de bain
                  </label>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground/90">
                  Tags (séparés par des virgules)
                </label>
                <input
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="terrasse, balcon, vue mer..."
                  className="w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {advantages.length ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {advantages.slice(0, 6).map((tag, idx) => (
                      <Badge
                        key={`tag-${idx}-${tag}`}
                        variant="secondary"
                        className="bg-muted/70"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/60 p-4 backdrop-blur-md">
              <h3 className="text-base font-semibold tracking-tight">Photos</h3>

              <div
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 text-center transition-all ${
                  isDraggingImages
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40 bg-background/40 hover:bg-background/60"
                } ${imageImportBusy ? "pointer-events-none opacity-70" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDraggingImages(true)
                }}
                onDragLeave={() => setIsDraggingImages(false)}
                onDrop={onDrop}
                onClick={openFilePicker}
                role="button"
                tabIndex={0}
                aria-label="Ajouter des photos"
                aria-busy={imageImportBusy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    openFilePicker()
                  }
                }}
              >
                <div className="text-sm font-medium text-foreground/90">
                  {imageImportBusy
                    ? "Optimisation des images pour le stockage…"
                    : "Glissez-déposez des images ici"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {imageImportBusy
                    ? "Quelques secondes si les fichiers sont lourds."
                    : "ou cliquez pour sélectionner — redimensionnement auto pour tenir dans le navigateur."}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />

              {images.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((src, idx) => (
                    <div key={`preview-${idx}-${src.slice(0, 48)}`} className="relative">
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-white/50">
                        <Image
                          src={src}
                          alt={`Photo ${idx + 1}`}
                          fill
                          sizes="(min-width: 640px) 200px, 45vw"
                          unoptimized={unoptimizedForImages[idx] ?? false}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(src)}
                        aria-label="Supprimer cette image"
                        className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/30 bg-white/80 shadow-sm backdrop-blur transition-all hover:bg-white active:scale-[0.98]"
                      >
                        <XIcon className="size-4 opacity-80" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ajoutez au moins une photo.
                </p>
              )}
            </section>

            <section className="space-y-4 rounded-2xl border border-white/10 bg-white/60 p-4 backdrop-blur-md">
              <h3 className="text-base font-semibold tracking-tight">
                Localisation
              </h3>

              <div className="relative isolate overflow-hidden rounded-2xl border border-border/40 bg-background/30">
                <div
                  ref={miniMapContainerRef}
                  className="relative h-56 min-h-56 w-full [&_.maplibregl-canvas]:!outline-none"
                  aria-label="Mini carte de sélection"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground/90">
                    Latitude
                  </label>
                  <input
                    type="number"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    step={0.0001}
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground/90">
                    Longitude
                  </label>
                  <input
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    step={0.0001}
                    className="w-full rounded-xl border border-border bg-background/50 px-4 py-2 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
              >
                Annuler
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-xl disabled:opacity-60"
            >
              {apartment ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

