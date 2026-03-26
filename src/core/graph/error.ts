import { LetantError, LetantErrorCode } from "@/common/error";

type GraphErrorCode = Extract<LetantErrorCode, `GRAPH_${string}`>;

class GraphError extends LetantError {
  constructor(code: GraphErrorCode, message: string, options?: ErrorOptions) {
    super(code, message, options);
  }
}

export default GraphError;
