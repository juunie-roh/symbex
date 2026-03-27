import { createChildPath, createConvertResult } from "letant/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

import flatPattern from "../utility/pattern";

function isExternal(specifier: string): boolean {
  return (
    !specifier.startsWith(".") &&
    !specifier.startsWith("/") &&
    !specifier.startsWith("@/") // your path alias
  );
}

const cjsBindingHandler: ConvertHandler<"cjs.binding"> = (captures, parent) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    const { source, name } = c;

    if (name.type === "identifier") {
      const path = createChildPath(parent, name.text);
      result.edges.push({ from: parent, to: path, kind: "imports" });
      result.nodes.push({
        path,
        type: "binding",
        kind: "cjs",
        at: { name: source.text, external: isExternal(source.text) },
      });
    } else {
      for (const { name: nm } of flatPattern(name)) {
        const path = createChildPath(parent, nm);
        result.edges.push({ from: parent, to: path, kind: "imports" });
        result.nodes.push({
          path,
          type: "binding",
          kind: "cjs",
          at: { name: source.text, external: isExternal(source.text) },
        });
      }
    }
  }

  return result;
};

export default cjsBindingHandler;
