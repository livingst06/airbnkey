"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type MapLayoutContextValue = {
  mapOnly: boolean
  setMapOnly: (value: boolean) => void
  toggleMapOnly: () => void
}

const MapLayoutContext = createContext<MapLayoutContextValue | null>(null)

export function MapLayoutProvider({ children }: { children: ReactNode }) {
  const [mapOnly, setMapOnly] = useState(false)

  const toggleMapOnly = useCallback(() => {
    setMapOnly((prev) => !prev)
  }, [])

  const value = useMemo(
    () => ({ mapOnly, setMapOnly, toggleMapOnly }),
    [mapOnly, toggleMapOnly],
  )

  return (
    <MapLayoutContext.Provider value={value}>
      {children}
    </MapLayoutContext.Provider>
  )
}

export function useMapLayout() {
  const ctx = useContext(MapLayoutContext)
  if (!ctx) {
    throw new Error("useMapLayout must be used within MapLayoutProvider")
  }
  return ctx
}
