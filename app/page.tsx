import { ApartmentsProvider } from "@/app/components/apartments-context"
import { HomePageClient } from "@/app/home-page-client"
import { getApartmentsFresh } from "@/lib/apartments-db"

export default async function HomePage() {
  const initialApartments = await getApartmentsFresh().catch((error) => {
    console.error("[home-page] apartments load failed", error)
    return []
  })

  return (
    <ApartmentsProvider initialApartments={initialApartments}>
      <HomePageClient />
    </ApartmentsProvider>
  )
}
