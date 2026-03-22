import Image from "next/image"
import Link from "next/link"

const navLinks = [
  { href: "#appartements", label: "Appartements" },
  { href: "#about", label: "À propos" },
  { href: "#contact", label: "Contact" },
] as const

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 pr-14">
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
        <nav className="flex items-center gap-6" aria-label="Navigation principale">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
