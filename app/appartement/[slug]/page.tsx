import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { apartments } from "@/data/apartments"
import { Badge } from "@/components/ui/badge"
import { ApartmentCarousel } from "@/app/components/apartment-carousel"
import type { Apartment } from "@/types/apartments"

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
  console.log("slug:", slug)
  const apartment = getApartmentBySlug(slug)
  console.log("apartment:", apartment)

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
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex rounded-xl px-5 py-2.5 text-sm font-medium text-primary shadow-sm transition-all duration-200 ease-out hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5 active:scale-95 active:shadow-sm"
        >
          Retour à la liste
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

