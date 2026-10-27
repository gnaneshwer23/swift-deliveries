/**
 * A small query builder with the subset of the Supabase/PostgREST API that the
 * DeliverX server modules use, compiled to parameterised SQL for Neon.
 *
 * - Identifiers are validated against a strict pattern and double-quoted.
 * - Every value is a bound parameter with an explicit cast to the column's
 *   real type (loaded from information_schema), so jsonb, uuid, text[] and
 *   timestamps behave exactly as they did through PostgREST.
 * - Results use the same `{ data, error, count }` shape.
 */

export type Executor = (text: string, params: string[]) => Promise<Record<string, unknown>[]>;
/** column name -> SQL type for casts, per table. */
export type ColumnTypes = Map<string, Map<string, string>>;

export type DbError = { message: string; code?: string | undefined };
export type DbResult<T = any> = { data: T; error: DbError | null; count?: number | null };

const IDENT = /^[a-z_][a-z0-9_]*$/;

function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return `"${name}"`;
}

/** Serialise a JS value as a text parameter for an explicitly cast placeholder. */
export function toParam(value: unknown, sqlType: string): string | null {
  if (value === null || value === undefined) return null;
  if (sqlType.endsWith("[]")) {
    const items = Array.isArray(value) ? value : [value];
    return `{${items.map((v) => `"${String(v).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`).join(",")}}`;
  }
  if (sqlType === "jsonb" || sqlType === "json") return JSON.stringify(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

type Op = "select" | "insert" | "update" | "upsert" | "delete";
type Filter = { col: string; kind: "eq" | "in" | "gt"; value: unknown };

export class QueryBuilder<T = any> implements PromiseLike<DbResult<T>> {
  private op: Op = "select";
  private columns = "*";
  private returning: string | null = null;
  private filters: Filter[] = [];
  private orders: Array<{ col: string; asc: boolean }> = [];
  private limitN: number | null = null;
  private rows: Record<string, unknown>[] = [];
  private patch: Record<string, unknown> = {};
  private onConflict: string[] = [];
  private mode: "many" | "single" | "maybeSingle" = "many";
  private countOnly = false;

  constructor(
    private readonly table: string,
    private readonly exec: Executor,
    private readonly types: () => Promise<ColumnTypes>,
  ) {
    ident(table);
  }

  select(columns = "*", opts?: { count?: "exact"; head?: boolean }): this {
    if (this.op === "select") {
      this.columns = columns;
      if (opts?.head) this.countOnly = true;
    } else {
      this.returning = columns;
    }
    return this;
  }
  insert(rows: Record<string, unknown> | Record<string, unknown>[]): this {
    this.op = "insert";
    this.rows = Array.isArray(rows) ? rows : [rows];
    return this;
  }
  upsert(
    rows: Record<string, unknown> | Record<string, unknown>[],
    opts?: { onConflict?: string },
  ): this {
    this.op = "upsert";
    this.rows = Array.isArray(rows) ? rows : [rows];
    this.onConflict = (opts?.onConflict ?? "id").split(",").map((s) => s.trim());
    return this;
  }
  update(patch: Record<string, unknown>): this {
    this.op = "update";
    this.patch = patch;
    return this;
  }
  delete(): this {
    this.op = "delete";
    return this;
  }
  eq(col: string, value: unknown): this {
    this.filters.push({ col, kind: "eq", value });
    return this;
  }
  /** Strictly greater than, for cursor reads. */
  gt(col: string, value: unknown): this {
    this.filters.push({ col, kind: "gt", value });
    return this;
  }

  in(col: string, values: unknown[]): this {
    this.filters.push({ col, kind: "in", value: values });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orders.push({ col, asc: opts?.ascending ?? true });
    return this;
  }
  limit(n: number): this {
    this.limitN = Math.max(0, Math.floor(n));
    return this;
  }
  single(): PromiseLike<DbResult<T>> {
    this.mode = "single";
    return this;
  }
  maybeSingle(): PromiseLike<DbResult<T>> {
    this.mode = "maybeSingle";
    return this;
  }

  /** Builds SQL and parameters; exported for tests. */
  async compile(): Promise<{ text: string; params: (string | null)[] }> {
    const types = (await this.types()).get(this.table);
    if (!types) throw new Error(`Unknown table: ${this.table}`);
    const params: (string | null)[] = [];
    const typeOf = (col: string) => {
      const t = types.get(col);
      if (!t) throw new Error(`Unknown column ${this.table}.${col}`);
      return t;
    };
    const bind = (col: string, value: unknown) => {
      const t = typeOf(col);
      params.push(toParam(value, t));
      return `$${params.length}::${t}`;
    };
    const cols = (list: string) =>
      list.trim() === "*"
        ? "*"
        : list
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              typeOf(c);
              return ident(c);
            })
            .join(", ");
    const where = () => {
      if (!this.filters.length) return "";
      return ` where ${this.filters
        .map((f) => {
          if (f.kind === "eq") {
            if (f.value === null) return `${ident(f.col)} is null`;
            return `${ident(f.col)} = ${bind(f.col, f.value)}`;
          }
          if (f.kind === "gt") return `${ident(f.col)} > ${bind(f.col, f.value)}`;
          const values = f.value as unknown[];
          if (!values.length) return "false";
          return `${ident(f.col)} in (${values.map((v) => bind(f.col, v)).join(", ")})`;
        })
        .join(" and ")}`;
    };
    const t = ident(this.table);
    const ret = this.returning ? ` returning ${cols(this.returning)}` : "";

    if (this.op === "select") {
      if (this.countOnly)
        return { text: `select count(*)::int as count from ${t}${where()}`, params };
      const order = this.orders.length
        ? ` order by ${this.orders.map((o) => `${ident(o.col)} ${o.asc ? "asc" : "desc"}`).join(", ")}`
        : "";
      const limit = this.limitN !== null ? ` limit ${this.limitN}` : "";
      return { text: `select ${cols(this.columns)} from ${t}${where()}${order}${limit}`, params };
    }
    if (this.op === "insert" || this.op === "upsert") {
      if (!this.rows.length) throw new Error("Nothing to insert");
      const keys = [...new Set(this.rows.flatMap((r) => Object.keys(r)))];
      keys.forEach(typeOf);
      const values = this.rows
        .map((r) => `(${keys.map((k) => (k in r ? bind(k, r[k]) : "default")).join(", ")})`)
        .join(", ");
      let text = `insert into ${t} (${keys.map(ident).join(", ")}) values ${values}`;
      if (this.op === "upsert") {
        const updates = keys.filter((k) => !this.onConflict.includes(k));
        text += ` on conflict (${this.onConflict.map(ident).join(", ")}) do ${
          updates.length
            ? `update set ${updates.map((k) => `${ident(k)} = excluded.${ident(k)}`).join(", ")}`
            : "nothing"
        }`;
      }
      return { text: text + ret, params };
    }
    if (this.op === "update") {
      const keys = Object.keys(this.patch).filter((k) => this.patch[k] !== undefined);
      if (!keys.length) throw new Error("Nothing to update");
      const set = keys.map((k) => `${ident(k)} = ${bind(k, this.patch[k])}`).join(", ");
      if (!this.filters.length) throw new Error("Refusing to update without a filter");
      return { text: `update ${t} set ${set}${where()}${ret}`, params };
    }
    if (!this.filters.length) throw new Error("Refusing to delete without a filter");
    return { text: `delete from ${t}${where()}${ret}`, params };
  }

  private async run(): Promise<DbResult<T>> {
    try {
      const { text, params } = await this.compile();
      const rows = await this.exec(text, params as string[]);
      if (this.countOnly)
        return { data: null as T, error: null, count: Number(rows[0]?.["count"] ?? 0) };
      const isWrite = this.op !== "select";
      if (isWrite && !this.returning) return { data: null as T, error: null };
      if (this.mode === "single") {
        if (rows.length !== 1) {
          return {
            data: null as T,
            error: { message: `Expected 1 row, got ${rows.length}`, code: "PGRST116" },
          };
        }
        return { data: rows[0] as T, error: null };
      }
      if (this.mode === "maybeSingle") {
        if (rows.length > 1)
          return {
            data: null as T,
            error: { message: "Expected at most 1 row", code: "PGRST116" },
          };
        return { data: (rows[0] ?? null) as T, error: null };
      }
      return { data: rows as T, error: null };
    } catch (err) {
      const e = err as { message?: string; code?: string };
      return { data: null as T, error: { message: e.message ?? "Database error", code: e.code } };
    }
  }

  then<R1 = DbResult<T>, R2 = never>(
    onfulfilled?: ((value: DbResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onfulfilled, onrejected);
  }
}

export type Db = {
  from: (table: string) => QueryBuilder;
  rpc: (fn: string) => Promise<DbResult>;
};

export function createDb(exec: Executor, types: () => Promise<ColumnTypes>): Db {
  return {
    from: (table) => new QueryBuilder(table, exec, types),
    rpc: async (fn) => {
      try {
        const rows = await exec(`select ${ident(fn)}() as value`, []);
        return { data: rows[0]?.["value"] ?? null, error: null };
      } catch (err) {
        const e = err as { message?: string; code?: string };
        return { data: null, error: { message: e.message ?? "Database error", code: e.code } };
      }
    },
  };
}
