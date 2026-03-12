import { apartments } from "@/data/apartments"
import { ApartmentGrid } from "./components/apartment-grid"
import { ApartmentMap } from "./components/apartment-map"
import { MainLayout } from "./components/main-layout"

export default function HomePage() {
  return (
    <MainLayout
      title="Airbnkey"
      left={<ApartmentGrid />}
      right={<ApartmentMap apartments={apartments} />}
    />
  )
}