/**
 * Column type handling shared by the app client and the database tests:
 * jsonb parameters arrive already serialised, and timestamps are ISO strings,
 * matching what the app received from PostgREST.
 */
export const POSTGRES_TYPES = {
  jsonb: {
    to: 3802,
    from: [114, 3802],
    serialize: (x: unknown) => (typeof x === "string" ? x : JSON.stringify(x)),
    parse: (x: string) => JSON.parse(x),
  },
  timestamptz: {
    to: 1184,
    from: [1114, 1184],
    serialize: (x: string) => x,
    parse: (x: string) => new Date(x.includes("+") || x.endsWith("Z") ? x : `${x}Z`).toISOString(),
  },
};
