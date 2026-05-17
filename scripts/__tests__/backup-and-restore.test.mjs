import assert from "node:assert/strict"
import test from "node:test"

import { listFilesRecursive } from "../backup-supabase-prod.mjs"
import { assertBackupMatchesDatabase } from "../restore-prod-db-from-backup.mjs"

test("listFilesRecursive paginates storage listings and recurses into folders", async () => {
  const firstRootPage = Array.from({ length: 1000 }, (_, index) => ({
    id: `file-${index}`,
    name: `file-${index}.jpg`,
  }))
  const secondRootPage = [{ id: null, name: "nested" }]
  const nestedPage = [{ id: "nested-file", name: "inside.jpg" }]
  const calls = []

  const bucketClient = {
    async list(prefix, options) {
      calls.push({ prefix, offset: options.offset, limit: options.limit })

      if (prefix === "" && options.offset === 0) {
        return { data: firstRootPage, error: null }
      }
      if (prefix === "" && options.offset === 1000) {
        return { data: secondRootPage, error: null }
      }
      if (prefix === "nested" && options.offset === 0) {
        return { data: nestedPage, error: null }
      }

      return { data: [], error: null }
    },
  }

  const files = await listFilesRecursive(bucketClient)

  assert.equal(files.length, 1001)
  assert.equal(files[0], "file-0.jpg")
  assert.equal(files[999], "file-999.jpg")
  assert.equal(files[1000], "nested/inside.jpg")
  assert.deepEqual(
    calls.filter((call) => call.prefix === "").map((call) => call.offset),
    [0, 1000]
  )
  assert.deepEqual(
    calls.filter((call) => call.prefix === "nested").map((call) => call.offset),
    [0]
  )
})

test("assertBackupMatchesDatabase allows restores into the original database host", () => {
  assert.doesNotThrow(() =>
    assertBackupMatchesDatabase({
      payload: { databaseUrlHost: "db.example.supabase.co:5432" },
      databaseUrl: "postgresql://user:password@db.example.supabase.co:5432/postgres",
    })
  )
})

test("assertBackupMatchesDatabase rejects backups without provenance", () => {
  assert.throws(
    () =>
      assertBackupMatchesDatabase({
        payload: {},
        databaseUrl: "postgresql://user:password@db.example.supabase.co:5432/postgres",
      }),
    /missing databaseUrlHost/
  )
})

test("assertBackupMatchesDatabase rejects destructive restores into a different database host", () => {
  assert.throws(
    () =>
      assertBackupMatchesDatabase({
        payload: { databaseUrlHost: "prod.example.supabase.co:5432" },
        databaseUrl: "postgresql://user:password@staging.example.supabase.co:5432/postgres",
      }),
    /Refusing to restore backup/
  )
})

test("assertBackupMatchesDatabase can be explicitly overridden for planned host migrations", () => {
  assert.doesNotThrow(() =>
    assertBackupMatchesDatabase({
      payload: { databaseUrlHost: "prod.example.supabase.co:5432" },
      databaseUrl: "postgresql://user:password@replacement.example.supabase.co:5432/postgres",
      allowCrossDatabaseRestore: true,
    })
  )
})
