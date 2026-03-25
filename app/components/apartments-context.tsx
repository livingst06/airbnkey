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
  updateApartmentAction,
} from "@/app/actions/apartments"
import type { ApartmentFormInput } from "@/lib/apartment-zod"
import type { Apartment } from "@/types/apartments"

export type { ApartmentFormInput } from "@/lib/apartment-zod"

type ApartmentsContextValue = {
  apartments: Apartment[]
  addApartment: (input: ApartmentFormInput) => Promise<Apartment>
  updateApartment: (id: string, input: ApartmentFormInput) => Promise<void>
  deleteApartment: (id: string) => Promise<void>
}

const ApartmentsContext = createContext<ApartmentsContextValue | null>(null)

export function ApartmentsProvider({
  children,
  initialApartments,
}: {
  children: React.ReactNode
  initialApartments: Apartment[]
}) {
  const [apartments, setApartments] = useState<Apartment[]>(initialApartments)

  const addApartment = useCallback(async (input: ApartmentFormInput) => {
    const r = await createApartmentAction(input)
    if (!r.ok) {
      toast.error("error" in r && r.error ? r.error : "Création impossible")
      throw new Error("createApartmentAction failed")
    }
    setApartments((prev) => [r.apartment, ...prev])
    return r.apartment
  }, [])

  const updateApartment = useCallback(
    async (id: string, input: ApartmentFormInput) => {
      const r = await updateApartmentAction(id, input)
      if (!r.ok) {
        toast.error(r.error ?? "Mise à jour impossible")
        throw new Error("updateApartmentAction failed")
      }
      setApartments((prev) =>
        prev.map((a) => (a.id === id ? r.apartment : a)),
      )
    },
    [],
  )

  const deleteApartment = useCallback(async (id: string) => {
    const r = await deleteApartmentAction(id)
    if (!r.ok) {
      toast.error(r.error ?? "Suppression impossible")
      throw new Error("deleteApartmentAction failed")
    }
    setApartments((prev) => prev.filter((a) => a.id !== id))
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
