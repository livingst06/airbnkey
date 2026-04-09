"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import maplibregl from "maplibre-gl"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, XIcon } from "lucide-react"
import { toast } from "sonner"

import type { Apartment } from "@/types/apartments"
import {
  APARTMENT_CHARACTERISTIC_LABELS,
  APARTMENT_FIELD_LABELS,
} from "@/lib/apartment-field-labels"
import { apartmentFormSchema } from "@/lib/apartment-zod"
import { imageNeedsUnoptimized } from "@/lib/image-src"
import { getMapStyleUrl } from "@/lib/map-style"
import { uploadImage } from "@/lib/upload-image"
import { useApartments } from "./apartments-context"

/** Délai après ouverture du dialog : l'anim zoom + layout doivent être stabilisés avant `new Map()`. */
const MINI_MAP_INIT_DELAY_MS = 200

const MAX_IMAGES = 8

/**
 * Classes partagées entre tous les champs de saisie.
 * Utilise les variables CSS du projet → s'adapte automatiquement light / dark.
 */
const INPUT_CLS =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors duration-150"

/** Même chose pour les <input type="number"> : on y ajoute la suppression des spinners natifs. */
const NUMBER_INPUT_CLS =
  INPUT_CLS +
  " [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"

const LABEL_CLS = "mb-1.5 block text-sm font-medium text-foreground"

const SECTION_CLS =
  "rounded-2xl bg-card p-5 shadow-sm dark:shadow-none dark:border dark:border-white/10"

const SECTION_TITLE_CLS =
  "mb-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground"

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

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

function firstFormErrorMessage(messages: string[] | undefined): string | null {
  if (!messages) return null
  for (const message of messages) {
    if (message.trim()) return message
  }
  return null
}

function formatLatLng(value: number) {
  if (!Number.isFinite(value)) return 0
  return value
}

type SortablePhotoProps = {
  src: string
  index: number
  unoptimized: boolean
  onRemove: () => void
}

function SortablePhoto({ src, index, unoptimized, onRemove }: SortablePhotoProps) {
  const { listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: src })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative cursor-grab active:cursor-grabbing"
      {...listeners}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={src}
          alt={`Photo ${index + 1}`}
          fill
          sizes="(min-width: 640px) 200px, 45vw"
          unoptimized={unoptimized}
          className="h-full w-full object-cover"
        />
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove() }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Remove this image"
        className="absolute right-2 top-2 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-card shadow-md transition-all hover:bg-muted active:scale-95"
      >
        <XIcon className="size-3.5 text-foreground" />
      </button>
    </div>
  )
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
  const [city, setCity] = useState("")
  const [street, setStreet] = useState("")
  const [guests, setGuests] = useState(0)
  const [beds, setBeds] = useState(2)
  const [bathrooms, setBathrooms] = useState(1)
  const [reviewsCount, setReviewsCount] = useState("")
  const [ratingAverage, setRatingAverage] = useState("")
  const [tagsText, setTagsText] = useState("")
  const [latitude, setLatitude] = useState(43.5528)
  const [longitude, setLongitude] = useState(7.0174)
  const [images, setImages] = useState<string[]>([])
  const [bookingUrl, setBookingUrl] = useState("")
  const [imageImportBusy, setImageImportBusy] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const imagesRef = useRef(images)
  imagesRef.current = images

  const latitudeRef = useRef(latitude)
  const longitudeRef = useRef(longitude)
  useEffect(() => { latitudeRef.current = latitude }, [latitude])
  useEffect(() => { longitudeRef.current = longitude }, [longitude])

  const committedRef = useRef(false)

  const miniMapContainerRef = useRef<HTMLDivElement | null>(null)
  const miniMapRef = useRef<maplibregl.Map | null>(null)
  const miniMarkerRef = useRef<maplibregl.Marker | null>(null)

  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  /** Après un drop, certains navigateurs déclenchent aussi un `click` sur la zone → doublon si on ouvre le file input. */
  const suppressPickerAfterDropRef = useRef(false)
  const suppressPickerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const unoptimizedForImages = useMemo(
    () => images.map((src) => imageNeedsUnoptimized(src)),
    [images],
  )

  useEffect(() => {
    if (!open) return
    committedRef.current = false
    setIsSaving(false)
    setFieldErrors({})
    setFormError(null)
    if (apartment) {
      setTitle(apartment.title)
      setDescription(apartment.description)
      setCity(apartment.city ?? "")
      setStreet(apartment.street ?? "")
      setGuests(Number.isFinite(apartment.guests) ? apartment.guests : 0)
      setBeds(apartment.beds)
      setBathrooms(apartment.bathrooms)
      setReviewsCount(
        apartment.reviewsCount !== null && apartment.reviewsCount !== undefined
          ? String(apartment.reviewsCount)
          : "",
      )
      setRatingAverage(
        apartment.ratingAverage !== null && apartment.ratingAverage !== undefined
          ? String(apartment.ratingAverage)
          : "",
      )
      setTagsText(apartment.advantages?.join(", ") ?? "")
      setLatitude(apartment.latitude)
      setLongitude(apartment.longitude)
      setImages([...apartment.images])
      setBookingUrl(apartment.bookingUrl?.trim() ? apartment.bookingUrl : "")
    } else {
      setTitle("")
      setDescription("")
      setCity("")
      setStreet("")
      setGuests(0)
      setBeds(2)
      setBathrooms(1)
      setReviewsCount("")
      setRatingAverage("")
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
      map.on("load", () => map.resize())

      resizeObserver = new ResizeObserver(() => map.resize())
      resizeObserver.observe(container)
    }, MINI_MAP_INIT_DELAY_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timerId)
      resizeObserver?.disconnect()
      resizeObserver = null
      if (mapInstance) {
        try { mapInstance.remove() } catch { /* noop */ }
        mapInstance = null
      }
      miniMapRef.current = null
      miniMarkerRef.current = null
    }
  }, [open])

  useEffect(() => {
    miniMarkerRef.current?.setLngLat([longitude, latitude])
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
            toast.error(`Image skipped: ${file.name}`)
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
    if (suppressPickerTimeoutRef.current) clearTimeout(suppressPickerTimeoutRef.current)
    suppressPickerTimeoutRef.current = setTimeout(() => {
      suppressPickerAfterDropRef.current = false
      suppressPickerTimeoutRef.current = null
    }, 400)
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (src: string) => {
    setImages((prev) => prev.filter((img) => img !== src))
  }

  const imageSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleImageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setImages((prev) => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const advantages = useMemo(() => parseTags(tagsText), [tagsText])

  const fieldError = (name: string) => fieldErrors[name]?.[0] ?? null

  const submit = async () => {
    if (isSaving) return
    setFieldErrors({})
    setFormError(null)

    const input = {
      title: title.trim(),
      description: description.trim(),
      city: city.trim(),
      street: street.trim() || undefined,
      guests,
      beds,
      bathrooms,
      reviewsCount:
        reviewsCount.trim() === "" ? null : Number.parseInt(reviewsCount.trim(), 10),
      ratingAverage:
        ratingAverage.trim() === "" ? null : Number.parseFloat(ratingAverage.trim()),
      advantages,
      latitude: formatLatLng(latitude),
      longitude: formatLatLng(longitude),
      images: [...images],
      bookingUrl: bookingUrl.trim(),
    } satisfies Parameters<typeof apartmentFormSchema.safeParse>[0]

    const parsed = apartmentFormSchema.safeParse(input)
    if (!parsed.success) {
      const flattened = parsed.error.flatten()
      setFieldErrors(flattened.fieldErrors)
      setFormError(firstFormErrorMessage(flattened.formErrors))
      return
    }

    setIsSaving(true)
    try {
      const apartmentName = parsed.data.title
      if (apartment) {
        await updateApartment(apartment.id, parsed.data)
        toast.success(`Apartment "${apartmentName}" updated`)
      } else {
        await addApartment(parsed.data)
        toast.success(`Apartment "${apartmentName}" created`)
      }
      committedRef.current = true
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error, apartment ? "Update failed" : "Creation failed"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden border-0 bg-background p-0 shadow-2xl ring-0 inset-0 top-0 left-0 translate-x-0 translate-y-0 w-screen max-w-none h-dvh rounded-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:h-[66dvh] sm:w-[50vw] sm:max-w-none sm:rounded-3xl"
      >
        {/* Bouton fermer */}
        <DialogClose asChild>
          <button
            type="button"
            aria-label="Fermer"
            className="absolute right-4 top-4 z-[60] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-all duration-150 hover:bg-muted"
          >
            <XIcon className="size-4 text-muted-foreground" />
          </button>
        </DialogClose>

        {/* Corps scrollable */}
        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-7 md:px-8 md:py-8 space-y-3">
          <div className="pb-3">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              {apartment ? "Edit apartment" : "Add apartment"}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {apartment
                ? "Update details, photos, and location."
                : "Create a new apartment in a few minutes."}
            </DialogDescription>
          </div>

          <div className="space-y-3">
            {formError ? (
              <div className="rounded-xl border border-red-400/60 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
                {formError}
              </div>
            ) : null}

            {/* ── Main details ── */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>Main details</h3>
              <div className="space-y-4">
                <div>
                  <label className={LABEL_CLS}>Apartment name</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`${INPUT_CLS} ${fieldError("title") ? "border-red-500 focus:border-red-500" : ""}`}
                    placeholder="e.g. Croisette Sea View Studio"
                  />
                  {fieldError("title") ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("title")}</p>
                  ) : null}
                </div>
                <div>
                  <label className={LABEL_CLS}>{APARTMENT_FIELD_LABELS.description}</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the apartment..."
                    rows={4}
                    className={`w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus-visible:ring-0 transition-colors duration-150 ${fieldError("description") ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  {fieldError("description") ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("description")}</p>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLS}>{APARTMENT_FIELD_LABELS.city}</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`${INPUT_CLS} ${fieldError("city") ? "border-red-500 focus:border-red-500" : ""}`}
                      placeholder="e.g. Cannes"
                    />
                    {fieldError("city") ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("city")}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{APARTMENT_FIELD_LABELS.street}</label>
                    <input
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className={`${INPUT_CLS} ${fieldError("street") ? "border-red-500 focus:border-red-500" : ""}`}
                      placeholder="e.g. 14 Juillet Street"
                    />
                    {fieldError("street") ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("street")}</p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>{APARTMENT_FIELD_LABELS.bookingUrl}</label>
                  <input
                    type="url"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    className={`${INPUT_CLS} ${fieldError("bookingUrl") ? "border-red-500 focus:border-red-500" : ""}`}
                    placeholder="https://..."
                  />
                  {fieldError("bookingUrl") ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("bookingUrl")}</p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* ── Characteristics ── */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>Characteristics</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={LABEL_CLS}>{APARTMENT_CHARACTERISTIC_LABELS.guests}</label>
                    <input
                      type="number"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      min={0}
                      className={`${NUMBER_INPUT_CLS} ${fieldError("guests") ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {fieldError("guests") ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("guests")}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{APARTMENT_CHARACTERISTIC_LABELS.beds}</label>
                    <input
                      type="number"
                      value={beds}
                      onChange={(e) => setBeds(Number(e.target.value))}
                      min={0}
                      className={`${NUMBER_INPUT_CLS} ${fieldError("beds") ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {fieldError("beds") ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("beds")}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{APARTMENT_CHARACTERISTIC_LABELS.bathrooms}</label>
                    <input
                      type="number"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                      min={0}
                      className={`${NUMBER_INPUT_CLS} ${fieldError("bathrooms") ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {fieldError("bathrooms") ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("bathrooms")}</p>
                    ) : null}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={LABEL_CLS}>{APARTMENT_CHARACTERISTIC_LABELS.reviewsCount}</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={reviewsCount}
                      onChange={(e) => setReviewsCount(e.target.value)}
                      min={0}
                      placeholder="e.g. 17"
                      className={`${NUMBER_INPUT_CLS} ${fieldError("reviewsCount") ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {fieldError("reviewsCount") ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("reviewsCount")}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className={LABEL_CLS}>{APARTMENT_CHARACTERISTIC_LABELS.ratingAverage}</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={ratingAverage}
                      onChange={(e) => setRatingAverage(e.target.value)}
                      min={0}
                      max={5}
                      step="0.1"
                      placeholder="e.g. 4.9"
                      className={`${NUMBER_INPUT_CLS} ${fieldError("ratingAverage") ? "border-red-500 focus:border-red-500" : ""}`}
                    />
                    {fieldError("ratingAverage") ? (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("ratingAverage")}</p>
                    ) : null}
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>
                    Tags{" "}
                    <span className="font-normal text-muted-foreground">(comma separated)</span>
                  </label>
                  <input
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="terrace, balcony, sea view..."
                    className={`${INPUT_CLS} ${fieldError("advantages") ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  {fieldError("advantages") ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("advantages")}</p>
                  ) : null}
                  {advantages.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {advantages.slice(0, 6).map((tag, idx) => (
                        <span
                          key={`tag-${idx}-${tag}`}
                          className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </section>

            {/* ── Photos ── */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>Photos</h3>
              <div
                className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-150 ${
                  isDraggingImages
                    ? "border-foreground bg-muted/80"
                    : "border-border bg-muted hover:border-foreground/40 hover:bg-muted/70"
                } ${imageImportBusy ? "pointer-events-none opacity-60" : ""}`}
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
                aria-label="Add photos"
                aria-busy={imageImportBusy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    openFilePicker()
                  }
                }}
              >
                <div className="text-sm font-medium text-foreground">
                  {imageImportBusy ? "Optimizing..." : "Drag and drop images here"}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {imageImportBusy
                    ? "This can take a few seconds for large files."
                    : "or click to select · automatic resize"}
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
                <DndContext
                  sensors={imageSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleImageDragEnd}
                >
                  <SortableContext items={images} strategy={rectSortingStrategy}>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {images.map((src, idx) => (
                        <SortablePhoto
                          key={src}
                          src={src}
                          index={idx}
                          unoptimized={unoptimizedForImages[idx] ?? false}
                          onRemove={() => removeImage(src)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  No photo added. A transparent placeholder will be used.
                </p>
              )}
              {fieldError("images") ? (
                <p className="mt-2 text-xs text-red-600 dark:text-red-300">{fieldError("images")}</p>
              ) : null}
            </section>

            {/* ── Location ── */}
            <section className={SECTION_CLS}>
              <h3 className={SECTION_TITLE_CLS}>Location</h3>
              <div className="overflow-hidden rounded-xl border border-border">
                <div
                  ref={miniMapContainerRef}
                  className="relative h-[28rem] min-h-[28rem] w-full [&_.maplibregl-canvas]:!outline-none"
                  aria-label="Mini map selector"
                />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={LABEL_CLS}>Latitude</label>
                  <input
                    type="number"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    step={0.0001}
                    className={`${NUMBER_INPUT_CLS} ${fieldError("latitude") ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  {fieldError("latitude") ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("latitude")}</p>
                  ) : null}
                </div>
                <div>
                  <label className={LABEL_CLS}>Longitude</label>
                  <input
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    step={0.0001}
                    className={`${NUMBER_INPUT_CLS} ${fieldError("longitude") ? "border-red-500 focus:border-red-500" : ""}`}
                  />
                  {fieldError("longitude") ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-300">{fieldError("longitude")}</p>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border bg-card px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-border text-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="rounded-xl bg-foreground text-background hover:bg-foreground/80 disabled:opacity-40"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </span>
            ) : apartment ? "Save" : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
