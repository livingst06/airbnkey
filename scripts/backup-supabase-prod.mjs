import "dotenv/config"

import fs from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"

import { createClient } from "@supabase/supabase-js"

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env var: ${name}`)
  return value
}

function isoStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-")
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function fetchAllRows(supabase, table) {
  const rows = []
  const pageSize = 1000

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(offset, offset + pageSize - 1)

    if (error) {
      throw new Error(`Data API read failed for table "${table}": ${error.message}`)
    }

    const page = data ?? []
    rows.push(...page)
    if (page.length < pageSize) break
  }

  return rows
}

async function backupDatabase({ outputDir, supabase }) {
  // Keep explicit list to avoid missing hidden/system-like tables and to stay restore-friendly.
  const tablesToBackup = ["Apartment", "_prisma_migrations"]
  const tableBackups = []

  for (const tableName of tablesToBackup) {
    const rows = await fetchAllRows(supabase, tableName)
    tableBackups.push({
      table: tableName,
      rowCount: rows.length,
      rows,
    })
  }

  const payload = {
    createdAt: new Date().toISOString(),
    databaseUrlHost: new URL(getRequiredEnv("DATABASE_URL")).host,
    schema: "public",
    source: "supabase-data-api-service-role",
    tables: tableBackups,
  }

  const outputFile = path.join(outputDir, "database-public-schema.json")
  await fs.writeFile(outputFile, JSON.stringify(payload, null, 2), "utf8")
  return {
    outputFile,
    tables: tableBackups.map((t) => ({ table: t.table, rowCount: t.rowCount })),
  }
}

export async function listFilesRecursive(bucketClient, prefix = "") {
  const files = []
  const pageSize = 1000

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await bucketClient.list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    })
    if (error) throw new Error(`Storage list failed at "${prefix}": ${error.message}`)

    const page = data ?? []
    for (const entry of page) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name
      const isFolder = entry.id == null
      if (isFolder) {
        files.push(...(await listFilesRecursive(bucketClient, fullPath)))
      } else {
        files.push(fullPath)
      }
    }

    if (page.length < pageSize) break
  }

  return files
}

async function backupStorage({ outputDir, bucket }) {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const bucketClient = supabase.storage.from(bucket)
  const files = await listFilesRecursive(bucketClient)

  const localRoot = path.join(outputDir, "storage", bucket)
  await ensureDir(localRoot)

  const downloaded = []
  for (const filePath of files) {
    const { data, error } = await bucketClient.download(filePath)
    if (error || !data) {
      throw new Error(`Storage download failed for "${filePath}": ${error?.message ?? "unknown error"}`)
    }
    const bytes = Buffer.from(await data.arrayBuffer())
    const localFile = path.join(localRoot, filePath)
    await ensureDir(path.dirname(localFile))
    await fs.writeFile(localFile, bytes)
    downloaded.push({ filePath, bytes: bytes.length })
  }

  const manifestFile = path.join(outputDir, "storage-manifest.json")
  await fs.writeFile(
    manifestFile,
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        bucket,
        fileCount: downloaded.length,
        files: downloaded,
      },
      null,
      2
    ),
    "utf8"
  )

  return { manifestFile, fileCount: downloaded.length }
}

async function main() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const backupRoot = path.resolve("backups")
  const stamp = isoStamp()
  const outputDir = path.join(backupRoot, `prod-backup-${stamp}`)
  await ensureDir(outputDir)

  const dbResult = await backupDatabase({ outputDir, supabase })
  const storageResult = await backupStorage({ outputDir, bucket: "apartments" })

  const summary = {
    createdAt: new Date().toISOString(),
    outputDir,
    databaseBackupFile: dbResult.outputFile,
    storageManifestFile: storageResult.manifestFile,
    tableCounts: dbResult.tables,
    storageFileCount: storageResult.fileCount,
  }
  await fs.writeFile(path.join(outputDir, "SUMMARY.json"), JSON.stringify(summary, null, 2), "utf8")

  console.log(JSON.stringify(summary, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || error?.message || String(error))
    process.exit(1)
  })
}
