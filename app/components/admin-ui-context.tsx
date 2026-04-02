"use client"

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react"

const ADMIN_MODE_STORAGE_KEY = "airbnkey:admin-mode"
const ADMIN_MODE_EVENT = "airbnkey:admin-mode-change"

type AdminUiContextValue = {
  isAdminAvailable: boolean
  isAdminMode: boolean
  setAdminMode: (next: boolean) => void
  toggleAdminMode: () => void
}

const AdminUiContext = createContext<AdminUiContextValue | null>(null)

function readAdminModeSnapshot(isAdminAvailable: boolean): boolean {
  if (!isAdminAvailable || typeof window === "undefined") return false
  return window.localStorage.getItem(ADMIN_MODE_STORAGE_KEY) === "true"
}

function subscribeAdminMode(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {}

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== ADMIN_MODE_STORAGE_KEY) return
    onStoreChange()
  }

  const handleCustomEvent = () => {
    onStoreChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(ADMIN_MODE_EVENT, handleCustomEvent)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(ADMIN_MODE_EVENT, handleCustomEvent)
  }
}

function writeAdminMode(next: boolean) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ADMIN_MODE_STORAGE_KEY, next ? "true" : "false")
  window.dispatchEvent(new Event(ADMIN_MODE_EVENT))
}

export function AdminUiProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdminAvailable = process.env.NEXT_PUBLIC_ADMIN_MODE === "true"
  const isAdminMode = useSyncExternalStore(
    subscribeAdminMode,
    () => readAdminModeSnapshot(isAdminAvailable),
    () => false,
  )

  const value = useMemo<AdminUiContextValue>(
    () => ({
      isAdminAvailable,
      isAdminMode,
      setAdminMode: (next) => {
        if (!isAdminAvailable) return
        writeAdminMode(next)
      },
      toggleAdminMode: () => {
        if (!isAdminAvailable) return
        writeAdminMode(!isAdminMode)
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
