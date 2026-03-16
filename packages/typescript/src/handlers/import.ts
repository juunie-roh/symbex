import type { NodePath } from "symbex";
import { createChildPath, createConvertResult } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const importHandler: ConvertHandler<"import"> = (captures, parent) => {
  const result = createConvertResult<Node, Edge>();
  const sources = new Set<string>();

  for (const c of captures) {
    const { source, name, alias, is_type } = c;
    if (!sources.has(source.text)) {
      sources.add(source.text);
    }

    const representative = alias?.text ?? name?.text ?? undefined;
    const isType = is_type ? true : false;

    if (representative) {
      const path = createChildPath(parent, representative);
      result.edges.push({
        from: parent,
        to: path,
        kind: "defines",
      });
      result.nodes.push({
        path,
        type: "binding",
        kind: isType ? "type" : "variable",
        props: alias
          ? {
              alias_of: name!.text,
              is_type: isType,
              source: source.text,
            }
          : undefined,
      });
    }
  }

  sources.forEach((source) => {
    result.edges.push({
      from: parent,
      to: [source] as NodePath,
      kind: "imports",
    });

    result.nodes.push({
      path: [source] as NodePath,
      type: "scope",
      kind: "module",
    });
  });

  return result;
};

export default importHandler;
