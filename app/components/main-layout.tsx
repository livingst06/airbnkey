import type { ReactNode } from "react"

type MainLayoutProps = {
  title: string
  left: ReactNode
  right?: ReactNode
}

export function MainLayout({ title, left, right }: MainLayoutProps) {
  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="mb-6 text-3xl font-semibold">{title}</h1>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section>{left}</section>

        {right ? (
          <section className="hidden lg:block">
            <div className="sticky top-20 h-[calc(100vh-7rem)]">
              {right}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}

