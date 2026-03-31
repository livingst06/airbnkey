import { ApartmentsProvider } from "@/app/components/apartments-context"
import { HomePageClient } from "@/app/home-page-client"
import { getApartmentsCached } from "@/lib/apartments-db"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const initialApartments =
    process.env.NODE_ENV === "development"
      ? await getApartmentsCached().catch(() => [])
      : await getApartmentsCached()

  return (
    <ApartmentsProvider initialApartments={initialApartments}>
      <HomePageClient />
    </ApartmentsProvider>
  )
}
