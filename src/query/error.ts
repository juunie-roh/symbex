import { SpineError, SpineErrorCode } from "@/shared/error";

type QueryErrorCode = Extract<SpineErrorCode, `QUERY_${string}`>;

class QueryError extends SpineError {
  constructor(code: QueryErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export { QueryError };
