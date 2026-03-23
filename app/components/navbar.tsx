import Image from "next/image"
import Link from "next/link"

import { ThemeToggle } from "@/components/theme-toggle"

const navLinks = [
  { href: "#appartements", label: "Appartements" },
  { href: "#about", label: "À propos" },
  { href: "#contact", label: "Contact" },
] as const

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-white/60 backdrop-blur-md dark:border-white/5 dark:bg-neutral-900/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:h-16">
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
          aria-label="Airbnkey — accueil"
        >
          <Image
            src="/favicon.svg"
            alt="Airbnkey"
            width={28}
            height={28}
            className="rounded-md"
          />
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label="Navigation principale"
          >
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:opacity-80"
              >
                {label}
              </a>
            ))}
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
