import { AdminPanel } from "@/app/components/admin-panel"

const isAdmin = process.env.NEXT_PUBLIC_ADMIN_MODE === "true"

export default function AdminPage() {
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Accès refusé
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Activez `NEXT_PUBLIC_ADMIN_MODE=true` pour accéder au mini CMS.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 xl:px-8">
      <AdminPanel />
    </div>
  )
}

