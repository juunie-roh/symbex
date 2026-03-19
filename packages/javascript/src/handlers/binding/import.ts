import { createChildPath, createConvertResult } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

function isExternal(specifier: string): boolean {
  return (
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !specifier.startsWith("@/") // your path alias
  );
}

const importHandler: ConvertHandler<"import"> = (captures, parent) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    const { source, name, alias } = c;

    const representative = alias?.text ?? name?.text ?? undefined;

    if (representative) {
      const path = createChildPath(parent, representative);
      result.edges.push({ from: parent, to: path, kind: "imports" });
      result.nodes.push({
        path,
        type: "binding",
        kind: "variable",
        at: { name: source.text, external: isExternal(source.text) },
        props: alias ? { alias_of: name!.text } : undefined,
      });
    }
  }

  return result;
};

export default importHandler;
