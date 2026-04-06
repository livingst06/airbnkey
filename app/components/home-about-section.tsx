"use client"

import Image from "next/image"

export function HomeAboutSection() {
  return (
    <section id="about" className="scroll-mt-20 py-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="max-w-lg space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            À propos
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Airbnkey sélectionne des appartements à Cannes pour des séjours
            agréables : emplacements pratiques, logements équipés et
            accompagnement simple du premier contact au départ.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Notre objectif est de rendre la location courte durée claire et
            sereine, avec des informations utiles et une présentation
            transparente de chaque bien.
          </p>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-[1.01]">
          <Image
            src="/apartments/apt1/1.png"
            alt="Salon lumineux d’un appartement à Cannes"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 480px, 100vw"
            priority={false}
          />
        </div>
      </div>
    </section>
  )
}
