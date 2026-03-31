"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

import { toast } from "sonner"

import {
  createApartmentAction,
  deleteApartmentAction,
  listApartmentsAction,
  updateApartmentAction,
  updateApartmentsOrderAction,
} from "@/app/actions/apartments"
import type { ApartmentFormInput } from "@/lib/apartment-zod"
import type { Apartment } from "@/types/apartments"

export type { ApartmentFormInput } from "@/lib/apartment-zod"

const APARTMENTS_SYNC_EVENT = "apartments:sync-needed"
const APARTMENTS_LOCAL_ORDER_KEY = "apartments:local-order"
const APARTMENTS_NEEDS_SYNC_KEY = "apartments:needs-sync"

type ApartmentOrderSnapshot = { id: string; position: number }[]

type ApartmentsContextValue = {
  apartments: Apartment[]
  syncFromDb: () => Promise<Apartment[]>
  addApartment: (input: ApartmentFormInput) => Promise<Apartment>
  updateApartment: (id: string, input: ApartmentFormInput) => Promise<void>
  deleteApartment: (id: string) => Promise<void>
  /** Ordre global 0..n-1 ; optimiste puis persistance serveur (admin uniquement côté action). */
  reorderApartments: (
    ordered: { id: string; position: number }[],
  ) => void
}

const ApartmentsContext = createContext<ApartmentsContextValue | null>(null)

function applyApartmentOrder(
  apartments: Apartment[],
  ordered: ApartmentOrderSnapshot,
): Apartment[] {
  const byId = new Map(apartments.map((a) => [a.id, a]))
  const next = [...ordered]
    .sort((x, y) => x.position - y.position)
    .map(({ id, position }) => {
      const apartment = byId.get(id)
      return apartment ? { ...apartment, position } : null
    })
    .filter((apartment): apartment is Apartment => apartment !== null)

  return next.length === apartments.length ? next : apartments
}

function persistApartmentOrder(ordered: ApartmentOrderSnapshot) {
  if (typeof window === "undefined") return
  window.sessionStorage.setItem(APARTMENTS_NEEDS_SYNC_KEY, "1")
  window.sessionStorage.setItem(APARTMENTS_LOCAL_ORDER_KEY, JSON.stringify(ordered))
}

function clearApartmentOrderPersistence() {
  if (typeof window === "undefined") return
  window.sessionStorage.removeItem(APARTMENTS_NEEDS_SYNC_KEY)
  window.sessionStorage.removeItem(APARTMENTS_LOCAL_ORDER_KEY)
}

export function ApartmentsProvider({
  children,
  initialApartments,
}: {
  children: React.ReactNode
  initialApartments: Apartment[]
}) {
  const [apartments, setApartments] = useState<Apartment[]>(initialApartments)

  const syncFromDb = useCallback(async () => {
    const list = await listApartmentsAction()
    setApartments(list)
    return list
  }, [])

  const addApartment = useCallback(
    async (input: ApartmentFormInput) => {
      const r = await createApartmentAction(input)
      if (!r.ok) {
        toast.error("error" in r && r.error ? r.error : "Création impossible")
        throw new Error("createApartmentAction failed")
      }
      const list = await syncFromDb()
      const created = list.find((a) => a.id === r.apartment.id) ?? r.apartment
      return created
    },
    [syncFromDb],
  )

  const updateApartment = useCallback(
    async (id: string, input: ApartmentFormInput) => {
      const r = await updateApartmentAction(id, input)
      if (!r.ok) {
        toast.error(r.error ?? "Mise à jour impossible")
        throw new Error("updateApartmentAction failed")
      }
      await syncFromDb()
    },
    [syncFromDb],
  )

  const deleteApartment = useCallback(
    async (id: string) => {
      const r = await deleteApartmentAction(id)
      if (!r.ok) {
        toast.error(r.error ?? "Suppression impossible")
        throw new Error("deleteApartmentAction failed")
      }
      await syncFromDb()
    },
    [syncFromDb],
  )

  const reorderApartments = useCallback(
    (ordered: { id: string; position: number }[]) => {
      setApartments((prev) => applyApartmentOrder(prev, ordered))
      void (async () => {
        const r = await updateApartmentsOrderAction(ordered)
        if (!r.ok) {
          clearApartmentOrderPersistence()
          toast.error(
            "error" in r && r.error ? r.error : "Ordre non enregistré",
          )
          await syncFromDb()
          return
        }
        persistApartmentOrder(ordered)
        window.dispatchEvent(new Event(APARTMENTS_SYNC_EVENT))
      })()
    },
    [syncFromDb],
  )

  const value = useMemo<ApartmentsContextValue>(
    () => ({
      apartments,
      syncFromDb,
      addApartment,
      updateApartment,
      deleteApartment,
      reorderApartments,
    }),
    [apartments, syncFromDb, addApartment, updateApartment, deleteApartment, reorderApartments],
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

export {
  APARTMENTS_LOCAL_ORDER_KEY,
  APARTMENTS_NEEDS_SYNC_KEY,
  APARTMENTS_SYNC_EVENT,
  applyApartmentOrder,
  clearApartmentOrderPersistence,
}
