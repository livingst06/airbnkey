"use client"

import { useState } from "react"
import { apartments } from "@/data/apartments"
import { ApartmentGrid } from "./components/apartment-grid"
import { ApartmentMap } from "./components/apartment-map"

export default function HomePage() {
  const [selectedApartmentId, setSelectedApartmentId] = useState<
    string | null
  >(null)
  const [dialogApartmentId, setDialogApartmentId] = useState<string | null>(
    null,
  )

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Airbnkey</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Locations d’appartements à Cannes
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>
          <ApartmentGrid
            selectedApartmentId={selectedApartmentId}
            setSelectedApartmentId={setSelectedApartmentId}
            dialogApartmentId={dialogApartmentId}
            setDialogApartmentId={setDialogApartmentId}
          />
        </section>

        <section className="hidden lg:block">
          <div className="sticky top-20 h-[calc(100vh-7rem)]">
            <ApartmentMap
              apartments={apartments}
              selectedApartmentId={selectedApartmentId}
              setSelectedApartmentId={setSelectedApartmentId}
              dialogApartmentId={dialogApartmentId}
              setDialogApartmentId={setDialogApartmentId}
            />
          </div>
        </section>
      </div>
    </main>
  )
}