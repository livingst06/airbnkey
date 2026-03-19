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
  const slug = params.slug
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
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Retour à la liste
        </Link>
      </div>

      <div className="space-y-6">
        <ApartmentCarousel images={images} title={apartment.title} />

        <div>
          <h1 className="text-2xl font-semibold">{apartment.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {apartment.beds} couchages • {apartment.bathrooms} salle de
            bain
          </p>
        </div>

        <p className="text-sm text-foreground">{apartment.description}</p>

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
  )
}

