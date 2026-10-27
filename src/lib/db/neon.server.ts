/**
 * Neon Postgres connection (server only). DATABASE_URL must be the pooled
 * connection string; prepared statements are off for the transaction pooler.
 */
import postgres from "postgres";
import { createDb, type ColumnTypes, type Db, type Executor } from "./builder";
import { POSTGRES_TYPES } from "./postgres-types";

let sql: ReturnType<typeof postgres> | null = null;
let typesPromise: Promise<ColumnTypes> | null = null;
let db: Db | null = null;

function client() {
  if (sql) return sql;
  const url = process.env["DATABASE_URL"];
  if (!url) throw new Error("DATABASE_URL is not configured.");
  sql = postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    types: POSTGRES_TYPES,
  });
  return sql;
}

async function loadColumnTypes(): Promise<ColumnTypes> {
  const rows = await client().unsafe<{ table_name: string; column_name: string; t: string }[]>(
    `select c.table_name, c.column_name,
            case when c.data_type = 'ARRAY' then substring(c.udt_name from 2) || '[]'
                 when c.data_type = 'USER-DEFINED' then c.udt_name
                 else c.udt_name end as t
       from information_schema.columns c
      where c.table_schema = 'public'`,
  );
  const map: ColumnTypes = new Map();
  for (const r of rows) {
    if (!map.has(r.table_name)) map.set(r.table_name, new Map());
    map.get(r.table_name)!.set(r.column_name, r.t);
  }
  return map;
}

export function neonDb(): Db {
  if (db) return db;
  db = createDb(
    async (text, params) =>
      (await client().unsafe(text, params)) as unknown as Record<string, unknown>[],
    () => {
      typesPromise ??= loadColumnTypes().catch((err) => {
        typesPromise = null;
        throw err;
      });
      return typesPromise;
    },
  );
  return db;
}

/** Runs all queries on one connection; any thrown error rolls the whole unit back. */
export async function neonTransaction<T>(
  work: (db: Db, query: Executor) => Promise<T>,
): Promise<T> {
  const types = await (typesPromise ??= loadColumnTypes().catch((error) => {
    typesPromise = null;
    throw error;
  }));
  return client().begin(async (tx) => {
    const query: Executor = async (text, params) =>
      (await tx.unsafe(text, params)) as unknown as Record<string, unknown>[];
    return work(
      createDb(query, async () => types),
      query,
    );
  }) as unknown as Promise<T>;
}
export type DbTransaction = typeof neonTransaction;
