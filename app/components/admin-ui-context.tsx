"use client"

import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react"

const ADMIN_MODE_STORAGE_KEY = "airbnkey:admin-mode"
const ADMIN_MODE_EVENT = "airbnkey:admin-mode-change"

type AdminUiContextValue = {
  isSignedIn: boolean
  userEmail: string | null
  isAdminEligible: boolean
  isAdminMode: boolean
  setAdminMode: (next: boolean) => void
  toggleAdminMode: () => void
}

const AdminUiContext = createContext<AdminUiContextValue | null>(null)

function readAdminModeSnapshot(isAdminEligible: boolean): boolean {
  if (!isAdminEligible || typeof window === "undefined") return false
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
  initialUserEmail,
  initialIsAdminEligible,
  children,
}: {
  initialUserEmail: string | null
  initialIsAdminEligible: boolean
  children: React.ReactNode
}) {
  const isSignedIn = Boolean(initialUserEmail)
  const isAdminEligible = initialIsAdminEligible
  const isAdminMode = useSyncExternalStore(
    subscribeAdminMode,
    () => readAdminModeSnapshot(isAdminEligible),
    () => false,
  )

  useEffect(() => {
    if (isAdminEligible) return
    writeAdminMode(false)
  }, [isAdminEligible])

  const value = useMemo<AdminUiContextValue>(
    () => ({
      isSignedIn,
      userEmail: initialUserEmail,
      isAdminEligible,
      isAdminMode,
      setAdminMode: (next) => {
        if (!isAdminEligible) return
        writeAdminMode(next)
      },
      toggleAdminMode: () => {
        if (!isAdminEligible) return
        writeAdminMode(!isAdminMode)
      },
    }),
    [initialUserEmail, isAdminEligible, isAdminMode, isSignedIn],
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
