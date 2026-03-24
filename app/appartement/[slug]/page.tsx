import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { apartments } from "@/data/apartments"
import { Badge } from "@/components/ui/badge"
import { ApartmentCarousel } from "@/app/components/apartment-carousel"
import type { Apartment } from "@/types/apartments"

const backToListLinkClass =
  "flex h-11 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/80 px-5 text-base font-medium text-black/80 shadow-md ring-1 ring-black/5 backdrop-blur-lg transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-white/90 active:scale-95 dark:border-white/10 dark:bg-neutral-800/80 dark:text-white/90 dark:ring-white/10 dark:hover:bg-neutral-800/90"

export const dynamic = "force-dynamic"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return apartments.map((apartment) => ({ slug: apartment.slug }))
}

function getApartmentBySlug(slug: string): Apartment | undefined {
  return apartments.find((apartment) => apartment.slug === slug)
}

export async function generateMetadata({
  params,
}: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = await params
  const apartment = getApartmentBySlug(slug)

  if (!apartment) {
    return {
      title: "Appartement introuvable",
      description: "Cet appartement n'existe pas.",
      openGraph: {
        title: "Appartement introuvable",
        description: "Cet appartement n'existe pas.",
      },
    }
  }

  return {
    title: apartment.title,
    description: apartment.description,
    openGraph: {
      title: apartment.title,
      description: apartment.description,
      images: [apartment.images[0]],
    },
    twitter: {
      card: "summary_large_image",
      title: apartment.title,
      description: apartment.description,
      images: [apartment.images[0]],
    },
  }
}

export default async function AppartementPage({ params }: PageProps) {
  const { slug } = await params
  const apartment = getApartmentBySlug(slug)

  if (!apartment) notFound()

  const images = apartment.images.slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="sticky top-4 z-50 mb-8 flex w-full justify-center px-4">
        <Link href="/" className={backToListLinkClass} aria-label="Retour à la liste">
          <ArrowLeft className="h-4 w-4 opacity-70" />
          <span>Retour à la liste</span>
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-colors duration-300 dark:border-neutral-700 dark:bg-neutral-800">
        <ApartmentCarousel
          variant="detail"
          images={images}
          title={apartment.title}
          slug={apartment.slug}
        />

        <div className="space-y-8 p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl dark:text-neutral-100">
              {apartment.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {apartment.beds} couchages • {apartment.bathrooms} salle de
              bain
            </p>
          </div>

          <p className="text-sm leading-relaxed text-foreground">
            {apartment.description}
          </p>

          {apartment.advantages?.length ? (
            <div className="flex flex-wrap gap-2">
              {apartment.advantages.map((advantage) => (
                <Badge key={advantage} variant="secondary">
                  {advantage}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

