/**
 * Test-only: serialises database test files that truncate the shared public tables.
 *
 * Test files run in parallel processes. Files that need the real public schema (constraints,
 * foreign keys) hold this session-level advisory lock for their whole run, so one file's
 * truncate never wipes another's rows mid-test.
 */
import postgres from "postgres";

/** Arbitrary fixed key shared by every file that truncates public tables. */
const PUBLIC_SCHEMA_TEST_LOCK = 4_812_003;

export async function holdPublicSchemaLock(url: string): Promise<() => Promise<void>> {
  const conn = postgres(url, { prepare: false, max: 1 });
  await conn`select pg_advisory_lock(${PUBLIC_SCHEMA_TEST_LOCK})`;
  return async () => {
    await conn`select pg_advisory_unlock(${PUBLIC_SCHEMA_TEST_LOCK})`;
    await conn.end();
  };
}
