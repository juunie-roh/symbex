import { createChildPath, createConvertResult, getRange } from "letant/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

import flatPattern from "../../utility/pattern";

const iifeImportHandler: ConvertHandler<"iife_import"> = (captures, parent) => {
  const result = createConvertResult<Node, Edge>();
  for (const c of captures) {
    const { kind, name, body } = c;

    if (name.type === "identifier") {
      const path = createChildPath(parent, name.text);
      result.edges.push({
        from: parent,
        to: path,
        kind: "imports",
      });
      result.nodes.push({
        path,
        type: "binding",
        kind: "iife_import",
        at: getRange(body),
        props: { kind: kind.text },
      });
    } else {
      for (const { name: nm } of flatPattern(name)) {
        const path = createChildPath(parent, nm);
        result.edges.push({
          from: parent,
          to: path,
          kind: "imports",
        });
        result.nodes.push({
          path,
          type: "binding",
          kind: "iife_import",
          at: getRange(body),
          props: { kind: kind.text },
        });
      }
    }
  }

  return result;
};

export default iifeImportHandler;
