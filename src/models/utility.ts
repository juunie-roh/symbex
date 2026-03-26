/**
 * @template T A type to make a brand on.
 * @template K A name of brand.
 * @example
 * type NodeId = Branded<string, "NodeId"> // NodeId = string & { readonly __brand: "NodeId" }
 */
export type Branded<T, K extends string> = T & { readonly __brand: K };

/**
 * Construct a type with the properties of T except for those in union type K.
 */
export type UnionOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;
