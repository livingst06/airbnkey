import "dotenv/config"

import fs from "node:fs/promises"
import path from "node:path"

import { PrismaClient } from "@prisma/client"

function parseArg(name) {
  const prefix = `${name}=`
  const arg = process.argv.find((entry) => entry.startsWith(prefix))
  return arg ? arg.slice(prefix.length) : null
}

async function resolveLatestBackupDir() {
  const backupsRoot = path.resolve("backups")
  const entries = await fs.readdir(backupsRoot, { withFileTypes: true })
  const dirs = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("prod-backup-"))
    .map((entry) => entry.name)
    .sort()

  if (dirs.length === 0) {
    throw new Error("No backup directory found in ./backups")
  }

  return path.join(backupsRoot, dirs[dirs.length - 1])
}

async function main() {
  const confirm = process.argv.includes("--yes-i-understand")
  if (!confirm) {
    throw new Error(
      "Refusing to run without confirmation flag. Re-run with --yes-i-understand"
    )
  }

  const backupArg = parseArg("--backup")
  const backupDir = backupArg ? path.resolve(backupArg) : await resolveLatestBackupDir()
  const backupFile = path.join(backupDir, "database-public-schema.json")

  const raw = await fs.readFile(backupFile, "utf8")
  const payload = JSON.parse(raw)
  const apartmentTable = payload.tables?.find((table) => table.table === "Apartment")

  if (!apartmentTable || !Array.isArray(apartmentTable.rows)) {
    throw new Error(`Apartment table not found in backup file: ${backupFile}`)
  }

  const rows = apartmentTable.rows
  const prisma = new PrismaClient()

  try {
    await prisma.$transaction(async (tx) => {
      await tx.apartment.deleteMany({})
      if (rows.length > 0) {
        await tx.apartment.createMany({ data: rows })
      }
    })
  } finally {
    await prisma.$disconnect()
  }

  console.log(
    JSON.stringify(
      {
        restoredTable: "Apartment",
        restoredRowCount: rows.length,
        backupDir,
        backupFile,
      },
      null,
      2
    )
  )
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error))
  process.exit(1)
})
