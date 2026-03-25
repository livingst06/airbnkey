"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { apartments as seedApartments } from "@/data/apartments"
import type { Apartment } from "@/types/apartments"

export type ApartmentFormInput = {
  title: string
  description: string
  beds: number
  bathrooms: number
  advantages: string[]
  latitude: number
  longitude: number
  images: string[]
}

type ApartmentsContextValue = {
  apartments: Apartment[]
  addApartment: (input: ApartmentFormInput) => Apartment
  updateApartment: (id: string, input: ApartmentFormInput) => void
  deleteApartment: (id: string) => void
}

const ApartmentsContext = createContext<ApartmentsContextValue | null>(null)

/** Persistance navigateur pour le CMS. Les chemins `/...` et les `data:` survivent au reload. Les `blob:` dans d’anciennes sauvegardes sont ignorés au chargement (URLs de session mortes). */
const STORAGE_KEY = "airbnkey_apartments"
/** Image locale sûre si une entrée persistée n’a plus d’URL valide après nettoyage des `blob:`. */
const PERSISTED_IMAGES_FALLBACK = "/apartments/apt1/1.png"

function cloneSeedApartments(): Apartment[] {
  return seedApartments.map((a) => ({
    ...a,
    images: [...a.images],
    advantages: [...a.advantages],
  }))
}

function isApartmentShape(x: unknown): x is Apartment {
  if (x === null || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return (
    typeof o.id === "string" &&
    typeof o.slug === "string" &&
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    typeof o.beds === "number" &&
    Number.isFinite(o.beds) &&
    typeof o.bathrooms === "number" &&
    Number.isFinite(o.bathrooms) &&
    Array.isArray(o.advantages) &&
    o.advantages.every((t) => typeof t === "string") &&
    typeof o.latitude === "number" &&
    Number.isFinite(o.latitude) &&
    typeof o.longitude === "number" &&
    Number.isFinite(o.longitude) &&
    Array.isArray(o.images) &&
    o.images.every((u) => typeof u === "string")
  )
}

/** Retire les `blob:` (invalides après refresh) ; garde au moins une image pour les composants qui supposent une vignette. */
function sanitizePersistedImages(a: Apartment): Apartment {
  const images = a.images.filter((u) => !u.startsWith("blob:"))
  return {
    ...a,
    advantages: [...a.advantages],
    images:
      images.length > 0 ? images : [PERSISTED_IMAGES_FALLBACK],
  }
}

function loadPersistedApartments(): Apartment[] | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const rows = parsed.filter(isApartmentShape)
    if (rows.length !== parsed.length) return null
    return rows.map(sanitizePersistedImages)
  } catch {
    return null
  }
}

function slugify(input: string): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
  return slug
}

function revokeBlobImages(images: string[]) {
  for (const url of images) {
    if (!url.startsWith("blob:")) continue
    try {
      URL.revokeObjectURL(url)
    } catch {
      // noop: URL.revokeObjectURL peut échouer si l’URL n’est plus valide.
    }
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function generateUniqueSlug(title: string, existingSlugs: Set<string>) {
  const base = slugify(title) || "apartment"
  let slug = base
  let i = 1
  while (existingSlugs.has(slug)) {
    slug = `${base}-${i}`
    i += 1
  }
  return slug
}

export function ApartmentsProvider({ children }: { children: React.ReactNode }) {
  const [apartments, setApartments] = useState<Apartment[]>(cloneSeedApartments)
  const [hasHydratedFromStorage, setHasHydratedFromStorage] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const loaded = loadPersistedApartments()
      if (loaded !== null) {
        setApartments(loaded)
      }
      setHasHydratedFromStorage(true)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (!hasHydratedFromStorage || typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apartments))
    } catch {
      // quota, navigation privée, etc.
    }
  }, [apartments, hasHydratedFromStorage])

  const addApartment = useCallback(
    (input: ApartmentFormInput) => {
      const nextId = generateId()
      const existingSlugs = new Set(apartments.map((a) => a.slug))
      const nextSlug = generateUniqueSlug(input.title, existingSlugs)

      const next: Apartment = {
        id: nextId,
        slug: nextSlug,
        title: input.title,
        description: input.description,
        beds: input.beds,
        bathrooms: input.bathrooms,
        advantages: [...input.advantages],
        latitude: input.latitude,
        longitude: input.longitude,
        images: [...input.images],
      }

      setApartments((prev) => [next, ...prev])
      return next
    },
    [apartments],
  )

  const updateApartment = useCallback((id: string, input: ApartmentFormInput) => {
    setApartments((prev) =>
      prev.map((apartment) => {
        if (apartment.id !== id) return apartment

        const nextImages = [...input.images]

        // UX critique ObjectURL: révoquer uniquement les blobs retirés.
        const removedImages = apartment.images.filter(
          (url) => url.startsWith("blob:") && !nextImages.includes(url),
        )
        revokeBlobImages(removedImages)

        return {
          ...apartment,
          // Ne jamais régénérer le slug en update.
          title: input.title,
          description: input.description,
          beds: input.beds,
          bathrooms: input.bathrooms,
          advantages: [...input.advantages],
          latitude: input.latitude,
          longitude: input.longitude,
          images: nextImages,
        }
      }),
    )
  }, [])

  const deleteApartment = useCallback((id: string) => {
    setApartments((prev) => {
      const victim = prev.find((a) => a.id === id)
      if (victim) revokeBlobImages(victim.images)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const value = useMemo<ApartmentsContextValue>(
    () => ({
      apartments,
      addApartment,
      updateApartment,
      deleteApartment,
    }),
    [apartments, addApartment, updateApartment, deleteApartment],
  )

  return (
    <ApartmentsContext.Provider value={value}>
      {children}
    </ApartmentsContext.Provider>
  )
}

export function useApartments(): ApartmentsContextValue {
  const ctx = useContext(ApartmentsContext)
  if (!ctx) {
    throw new Error("useApartments must be used within ApartmentsProvider")
  }
  return ctx
}

