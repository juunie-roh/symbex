import type { NodeId } from "symbex";

import { Graph } from "@/types";

/**
 * Outputs the graph in DOT format for visualization with Graphviz or compatible tools.
 * @param name Optional graph name.
 */
function toDot(graph: Graph, name = "symbex"): string {
  const lines: string[] = [
    `digraph ${JSON.stringify(name)} {`,
    "  rankdir=LR;",
  ];

  // Build a scope tree from all node IDs split by "::"
  const scopeChildren = new Map<NodeId, Set<NodeId>>();
  scopeChildren.set("" as NodeId, new Set());

  for (const id of graph.nodes.keys()) {
    const parts = id.split("::");
    for (let i = 1; i <= parts.length; i++) {
      const scope = parts.slice(0, i).join("::") as NodeId;
      const parent = parts.slice(0, i - 1).join("::") as NodeId;
      if (!scopeChildren.has(parent)) scopeChildren.set(parent, new Set());
      scopeChildren.get(parent)!.add(scope);
      if (!scopeChildren.has(scope)) scopeChildren.set(scope, new Set());
    }
  }

  const renderScope = (scope: NodeId, indent: string): void => {
    for (const child of scopeChildren.get(scope) ?? []) {
      const childChildren = scopeChildren.get(child);
      const hasChildren = (childChildren?.size ?? 0) > 0;
      const isNode = graph.nodes.has(child);
      const node = isNode ? graph.nodes.get(child) : undefined;
      const label = node?.kind === "module" ? child : child.split("::").pop()!;

      if (
        (hasChildren || child.includes("::")) &&
        node?.kind !== "variable" &&
        node?.kind !== "type" &&
        node?.kind !== "member"
      ) {
        lines.push(`${indent}subgraph ${JSON.stringify("cluster_" + child)} {`);
        lines.push(`${indent}  label=${JSON.stringify(label)};`);
        if (node) {
          const nodeLabel = `<${node.kind}>\n${label}`;
          lines.push(
            `${indent}  ${JSON.stringify(child)} [label=${JSON.stringify(nodeLabel)}, group=${JSON.stringify(node.kind)}];`,
          );
        }
        renderScope(child, indent + "  ");
        lines.push(`${indent}}`);
      } else if (node) {
        const nodeLabel = `<${node.kind}>\n${label}`;
        lines.push(
          `${indent}${JSON.stringify(child)} [label=${JSON.stringify(nodeLabel)}, group=${JSON.stringify(node.kind)}];`,
        );
      }
    }
  };

  renderScope("" as NodeId, "  ");

  const moduleIds = [...graph.nodes.entries()]
    .filter(([, node]) => node.kind === "module")
    .map(([id]) => JSON.stringify(id));
  if (moduleIds.length > 0) {
    lines.push(`  { rank=min; ${moduleIds.join("; ")}; }`);
  }

  for (const [from, toMap] of graph.edges) {
    for (const [to, kinds] of toMap) {
      for (const kind of kinds) {
        lines.push(
          `  ${JSON.stringify(from)} -> ${JSON.stringify(to)} [label=${JSON.stringify(kind)}];`,
        );
      }
    }
  }

  lines.push("}");
  return lines.join("\n");
}

export { toDot };
