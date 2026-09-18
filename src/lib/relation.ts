// PostgREST returns one-to-one relations as objects, and older joins as arrays.
export function firstRelated<T>(value: T | T[] | null | undefined): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}
