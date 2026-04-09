"use client"

import Image from "next/image"

export function HomeAboutSection() {
  return (
    <section id="about" className="scroll-mt-20 py-16">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div className="max-w-lg space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            About
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Airbnkey curates apartments in Cannes for smooth stays: practical
            locations, well-equipped homes, and simple support from first
            contact to checkout.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Our goal is to make short-term rentals clear and stress-free, with
            useful information and transparent presentation for every property.
          </p>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 hover:scale-[1.01]">
          <Image
            src="/apartments/apt1/1.png"
            alt="Bright apartment living room in Cannes"
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
