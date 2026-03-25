"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { toast } from "sonner"

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
const STORAGE_KEY = "apartments"
const LEGACY_STORAGE_KEY = "airbnkey_apartments"
/** Image locale sûre si une entrée persistée n’a plus d’URL valide après nettoyage des `blob:`. */
const PERSISTED_IMAGES_FALLBACK = "/apartments/apt1/1.png"

function cloneSeedApartments(): Apartment[] {
  return seedApartments.map((a) => ({
    ...a,
    images: [...a.images],
    advantages: [...a.advantages],
  }))
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

/** Reconstruit un appartement depuis le JSON stocké (tolérant : nombres en string, champs optionnels). */
function normalizeStoredApartment(x: unknown): Apartment | null {
  if (x === null || typeof x !== "object") return null
  const o = x as Record<string, unknown>
  if (typeof o.id !== "string" || !o.id) return null
  if (typeof o.slug !== "string") return null
  if (typeof o.title !== "string") return null
  if (typeof o.description !== "string") return null

  const beds = asFiniteNumber(o.beds)
  const bathrooms = asFiniteNumber(o.bathrooms)
  if (beds === null || bathrooms === null) return null

  const latitude = asFiniteNumber(o.latitude)
  const longitude = asFiniteNumber(o.longitude)
  if (latitude === null || longitude === null) return null

  let advantages: string[] = []
  if (Array.isArray(o.advantages)) {
    advantages = o.advantages.filter((t): t is string => typeof t === "string")
  }

  let images: string[] = []
  if (Array.isArray(o.images)) {
    images = o.images.filter((u): u is string => typeof u === "string")
  }

  return {
    id: o.id,
    slug: o.slug,
    title: o.title,
    description: o.description,
    beds,
    bathrooms,
    advantages,
    latitude,
    longitude,
    images,
  }
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

/** null = JSON invalide ou pas un tableau. Jamais rejeter toute la liste à cause d’une entrée corrompue (évite d’écraser localStorage avec le seed au prochain effet). */
function parseStoredApartments(raw: string): Apartment[] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
      .map(normalizeStoredApartment)
      .filter((a): a is Apartment => a !== null)
      .map(sanitizePersistedImages)
  } catch {
    return null
  }
}

function loadPersistedApartments(): Apartment[] | null {
  if (typeof window === "undefined") return null
  let raw = localStorage.getItem(STORAGE_KEY)
  let fromLegacy = false
  if (raw === null) {
    raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    fromLegacy = raw !== null
  }
  if (raw === null) return null
  const apartments = parseStoredApartments(raw)
  if (apartments === null) return null
  if (fromLegacy) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apartments))
      localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      // quota / navigation privée : la prochaine écriture tentera encore la nouvelle clé
    }
  }
  return apartments
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
    } catch (err) {
      const name = err instanceof DOMException ? err.name : ""
      if (
        name === "QuotaExceededError" ||
        name === "NS_ERROR_DOM_QUOTA_REACHED"
      ) {
        toast.error(
          "Stockage navigateur plein : les changements peuvent ne pas être enregistrés. Utilisez moins ou des images plus petites.",
          { duration: 8000 },
        )
      } else {
        toast.error(
          "Impossible d’enregistrer les appartements localement (mode privé ou accès bloqué ?).",
          { duration: 6000 },
        )
      }
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

