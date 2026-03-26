import { LetantError, LetantErrorCode } from "@/common/error";

type QueryErrorCode = Extract<LetantErrorCode, `QUERY_${string}`>;

class QueryError extends LetantError {
  constructor(code: QueryErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export default QueryError;
