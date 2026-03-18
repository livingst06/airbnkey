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
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="mb-6 text-3xl font-semibold">Airbnkey</h1>

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