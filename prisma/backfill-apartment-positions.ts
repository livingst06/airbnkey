/**
 * Réattribue position = 0..n-1 selon l’ordre courant (position, puis createdAt).
 * À lancer une fois après migration ou si plusieurs lignes ont la même position.
 *
 * Usage : pnpm db:backfill-positions
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.apartment.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  })
  await prisma.$transaction(
    rows.map((row, index) =>
      prisma.apartment.update({
        where: { id: row.id },
        data: { position: index },
      }),
    ),
  )
  console.log(`Backfill position OK (${rows.length} apartment(s)).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
