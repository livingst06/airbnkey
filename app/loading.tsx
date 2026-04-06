export default function Loading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-none px-3 pb-8 pt-6 sm:px-5 lg:px-6 2xl:px-10">
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-muted" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="h-16 rounded-2xl bg-muted" />
            <div className="h-[60vh] rounded-2xl bg-muted" />
          </div>
          <div className="h-[60vh] rounded-2xl bg-muted" />
        </div>
      </div>
    </main>
  )
}
