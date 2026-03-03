import type { Capture, Edge, Node } from "@/models";

import { convertClasses } from "./class";
import { convertFunctions } from "./function";
import { convertImports } from "./import";

function convert(
  captures: Capture.Result,
  parentId: string,
): { edges: Edge[]; nodes: Node[] } {
  const imports = convertImports(captures.imports, parentId);
  const functions = convertFunctions(captures.functions, parentId);
  const classes = convertClasses(captures.classes, parentId);

  return {
    edges: [...imports.edges, ...functions.edges, ...classes.edges],
    nodes: [...imports.nodes, ...functions.nodes, ...classes.nodes],
  };
}

export { convert };
