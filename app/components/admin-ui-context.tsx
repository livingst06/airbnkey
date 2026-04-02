"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react"

const ADMIN_MODE_STORAGE_KEY = "airbnkey:admin-mode"

type AdminUiContextValue = {
  isAdminAvailable: boolean
  isAdminMode: boolean
  setAdminMode: (next: boolean) => void
  toggleAdminMode: () => void
}

const AdminUiContext = createContext<AdminUiContextValue | null>(null)

export function AdminUiProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdminAvailable = process.env.NEXT_PUBLIC_ADMIN_MODE === "true"
  const [isAdminMode, setIsAdminMode] = useState(
    () =>
      isAdminAvailable &&
      typeof window !== "undefined" &&
      window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY) === "true",
  )

  const value = useMemo<AdminUiContextValue>(
    () => ({
      isAdminAvailable,
      isAdminMode,
      setAdminMode: (next) => {
        if (!isAdminAvailable) return
        setIsAdminMode(next)
        window.localStorage.setItem(ADMIN_MODE_STORAGE_KEY, next ? "true" : "false")
      },
      toggleAdminMode: () => {
        if (!isAdminAvailable) return
        setIsAdminMode((prev) => {
          const next = !prev
          window.localStorage.setItem(
            ADMIN_MODE_STORAGE_KEY,
            next ? "true" : "false",
          )
          return next
        })
      },
    }),
    [isAdminAvailable, isAdminMode],
  )

  return (
    <AdminUiContext.Provider value={value}>{children}</AdminUiContext.Provider>
  )
}

export function useAdminUi() {
  const ctx = useContext(AdminUiContext)
  if (!ctx) {
    throw new Error("useAdminUi must be used within AdminUiProvider")
  }
  return ctx
}
