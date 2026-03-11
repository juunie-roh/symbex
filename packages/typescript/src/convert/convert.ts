import type { CaptureResult, Edge, Node } from "@/types";

import { convertClasses } from "./class";
import { convertFunctions } from "./function";
import { convertImports } from "./import";
import { convertVariables } from "./variable";

function convert(
  captures: CaptureResult,
  parentId: string,
): { edges: Edge[]; nodes: Node[] } {
  const imports = convertImports(captures.import, parentId);
  const functions = convertFunctions(captures.function, parentId);
  const classes = convertClasses(captures.class, parentId);
  const variables = convertVariables(captures.variable, parentId);

  return {
    nodes: [
      ...imports.nodes,
      ...functions.nodes,
      ...classes.nodes,
      ...variables.nodes,
    ],
    edges: [
      ...imports.edges,
      ...functions.edges,
      ...classes.edges,
      ...variables.edges,
    ],
  };
}

export { convert };
