import { createChildPath, createConvertResult, getRange } from "symbex/utils";
import type { SyntaxNode } from "tree-sitter";

import type { ConvertHandler, Edge, Node } from "@/types";

import flatPattern from "../utility/pattern";

function handlesJSX(node: SyntaxNode): boolean {
  return (
    node.descendantsOfType(
      ["jsx_element", "jsx_self_closing_element"],
      node.startPosition,
      node.endPosition,
    ).length > 0
  );
}

const functionHandler: ConvertHandler<"function"> = (
  captures,
  parent,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    const { name, node, params, body, is_async } = c;
    const path = createChildPath(parent, name.text);

    result.edges.push({
      from: parent,
      to: path,
      kind: "defines",
    });

    result.nodes.push({
      path,
      type: "scope",
      kind: handlesJSX(body) ? "component" : "function",
      at: getRange(node),
      blockStartIndex: body.startIndex,
      props: { is_async: !!is_async },
    });

    if (params.type === "identifier") {
      const paramPath = createChildPath(path, params.text);
      result.edges.push({
        from: path,
        to: paramPath,
        kind: "defines",
      });

      result.nodes.push({
        path: paramPath,
        type: "binding",
        kind: "parameter",
        at: getRange(params),
      });
    } else {
      c.params.namedChildren.forEach((child) => {
        flatPattern(child).forEach(({ name, node, has_default }) => {
          const parameterPath = createChildPath(path, name);
          result.edges.push({
            from: path,
            to: parameterPath,
            kind: "defines",
          });
          result.nodes.push({
            path: parameterPath,
            type: "binding",
            kind: "parameter",
            at: getRange(node),
            props: { has_default },
          });
        });
      });
    }

    result.push(convert(capture(body), path));
  }

  return result;
};

export default functionHandler;
