import { LetantError } from "./error";

/**
 * Coerces the target to be true.
 */
function defined(target: boolean, error?: LetantError): asserts target;
/**
 * Coerces the target to be defined.
 */
function defined<T>(
  target: T | null | undefined,
  error?: LetantError,
): asserts target is T;

function defined(target: any, error?: LetantError) {
  if (target === false || target === null || typeof target === "undefined") {
    throw error ?? new Error("Unspecified undefined error");
  }
}

export { defined };
