import { ApartmentGrid } from "./components/apartment-grid"

export default function HomePage() {
  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-semibold mb-6">
        Airbnkey
      </h1>

      <ApartmentGrid />
    </main>
  )
}