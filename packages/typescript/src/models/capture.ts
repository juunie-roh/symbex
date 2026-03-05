import type TSParser from "tree-sitter";

namespace Capture {
  export interface Base {
    id: string;
    node: TSParser.SyntaxNode;
    body?: Result;
    /**
     * An identifier.
     */
    name?: string;
  }

  export interface Function extends Base {
    type_params: string[];
    params: string[];
    return_type?: string;
  }

  export interface Call extends Base {}

  export interface Class extends Base {
    type_params: string[];
    implements: string[];
    extends: string[];
  }

  export interface AbstractClass extends Base {}

  export interface Import extends Base {
    source: string;
    type?: "default" | "named_imports" | "namespace_import";
    alias?: string;
  }

  export interface Result {
    imports: Capture.Import[];
    functions: Capture.Function[];
    classes: Capture.Class[];
  }
}

export type { Capture };
