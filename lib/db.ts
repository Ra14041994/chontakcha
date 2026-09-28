import { neon } from '@neondatabase/serverless'
import { SCHEMA, SCHEMA_VERSION } from './schema'

export type Row = Record<string, any>
export type Stmt = { text: string; params?: unknown[] }

interface Driver {
  kind: 'neon' | 'pglite'
  query(text: string, params?: unknown[]): Promise<Row[]>
  batch(stmts: Stmt[]): Promise<void>
}

const g = globalThis as unknown as {
  __chDriver?: Promise<Driver>
  __chReady?: Promise<void> | null
}

export function databaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ''
  )
}

export function hasDatabase(): boolean {
  return Boolean(databaseUrl()) || !process.env.VERCEL
}

async function createDriver(): Promise<Driver> {
  const url = databaseUrl()
  if (url) {
    const sql = neon(url)
    return {
      kind: 'neon',
      query: async (text, params = []) => (await sql.query(text, params as any[])) as Row[],
      batch: async (stmts) => {
        if (!stmts.length) return
        await sql.transaction((tx) => stmts.map((s) => tx.query(s.text, (s.params || []) as any[])))
      },
    }
  }
  if (process.env.VERCEL) {
    throw new Error('DATABASE_URL topilmadi. Vercel → Storage bo‘limida Neon Postgres bazasini loyihaga ulang.')
  }
  // Lokal ishlab chiqish: fayldagi PGlite (haqiqiy Postgres, WebAssembly).
  const modName = '@electric-sql/pglite'
  const { PGlite } = (await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ modName)) as typeof import('@electric-sql/pglite')
  const dir = process.env.PGLITE_DIR || '.data/pglite'
  const fs = await import('node:fs')
  fs.mkdirSync(dir, { recursive: true })
  const db = await PGlite.create(dir)
  return {
    kind: 'pglite',
    query: async (text, params = []) => (await db.query(text, params as any[])).rows as Row[],
    batch: async (stmts) => {
      await db.transaction(async (tx) => {
        for (const s of stmts) await tx.query(s.text, (s.params || []) as any[])
      })
    },
  }
}

function driver(): Promise<Driver> {
  if (!g.__chDriver) {
    g.__chDriver = createDriver().catch((e) => {
      g.__chDriver = undefined
      throw e
    })
  }
  return g.__chDriver
}

async function migrate(d: Driver) {
  let version = 0
  try {
    const r = await d.query(`select v from meta where k = 'schema'`)
    version = Number(r[0]?.v || 0)
  } catch {
    version = 0
  }
  if (version < SCHEMA_VERSION) {
    for (const text of SCHEMA) await d.query(text)
    await d.query(
      `insert into meta (k, v) values ('schema', $1) on conflict (k) do update set v = excluded.v`,
      [String(SCHEMA_VERSION)],
    )
  }
  if (process.env.SEED_SAMPLE !== '0') {
    const seeded = await d.query(`select v from meta where k = 'seeded'`)
    if (!seeded.length) {
      const { sampleStatements } = await import('./seed')
      try {
        // Belgi bilan birga bitta tranzaksiyada: parallel ishga tushganda ikkinchisi xato bilan bekor bo‘ladi.
        await d.batch([{ text: `insert into meta (k, v) values ('seeded', '1')` }, ...sampleStatements()])
      } catch (e) {
        const again = await d.query(`select v from meta where k = 'seeded'`)
        if (!again.length) throw e
      }
    }
  }
}

function ready(d: Driver): Promise<void> {
  if (!g.__chReady) {
    g.__chReady = migrate(d).catch((e) => {
      g.__chReady = null
      throw e
    })
  }
  return g.__chReady
}

/** Parametrli SQL so‘rov. Qatorlar massivini qaytaradi. */
export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  const d = await driver()
  await ready(d)
  return (await d.query(text, params)) as T[]
}

/** Bitta qator yoki null. */
export async function one<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params)
  return rows[0] ?? null
}

/** Bir nechta buyruqni bitta tranzaksiyada bajarish (natija qaytarmaydi). */
export async function tx(stmts: Stmt[]): Promise<void> {
  const d = await driver()
  await ready(d)
  await d.batch(stmts)
}
