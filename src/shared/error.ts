type SpineErrorCode =
  // binary
  | "BIN_ERROR"
  // config
  | "CONFIG_INVALID_PATH"
  | "CONFIG_INVALID_SCHEMA"
  // core
  | "CORE_NO_CONFIG"
  | "CORE_UNSUPPORTED_LANGUAGE"
  | "CORE_SYNTAX_ERROR"
  | "CORE_UNDEFINED_INSTANCE"
  | "CORE_PLUGIN_LOAD_FAILED"
  | "CORE_PLUGIN_PARSE_FAILED"
  // graph
  | "GRAPH_NO_NODE"
  | "GRAPH_UNRESOLVED_EDGE"
  | "GRAPH_EDGE_RESOLUTION_FAILED"
  | "GRAPH_UNDEFINED_INSTANCE"
  // query
  | "QUERY_DUPLICATE_KEY"
  | "QUERY_INVALID_KEY";

class SpineError extends Error {
  readonly code: SpineErrorCode;

  constructor(code: SpineErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export { SpineError };
export type { SpineErrorCode };
