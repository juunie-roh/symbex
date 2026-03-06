import { Graph } from "@/models";

/**
 * Outputs the graph in DOT format for visualization with Graphviz or compatible tools.
 * @param name Optional graph name.
 */
function toDot(graph: Graph, name = "spine"): string {
  const lines: string[] = [
    `digraph ${JSON.stringify(name)} {`,
    "  rankdir=LR;",
  ];

  // Build a scope tree from all node IDs split by ":"
  const scopeChildren = new Map<string, Set<string>>();
  scopeChildren.set("", new Set());

  for (const id of graph.nodes.keys()) {
    const parts = id.split(":");
    for (let i = 1; i <= parts.length; i++) {
      const scope = parts.slice(0, i).join(":");
      const parent = parts.slice(0, i - 1).join(":");
      if (!scopeChildren.has(parent)) scopeChildren.set(parent, new Set());
      scopeChildren.get(parent)!.add(scope);
      if (!scopeChildren.has(scope)) scopeChildren.set(scope, new Set());
    }
  }

  const renderScope = (scope: string, indent: string): void => {
    for (const child of scopeChildren.get(scope) ?? []) {
      const childChildren = scopeChildren.get(child);
      const hasChildren = (childChildren?.size ?? 0) > 0;
      const isNode = graph.nodes.has(child);
      const label = child.split(":").pop()!;

      if (hasChildren || child.includes(":")) {
        lines.push(`${indent}subgraph ${JSON.stringify("cluster_" + child)} {`);
        lines.push(`${indent}  label=${JSON.stringify(label)};`);
        if (isNode) {
          const node = graph.nodes.get(child)!;
          const nodeLabel = `<${node.kind}>\n${label}`;
          lines.push(
            `${indent}  ${JSON.stringify(child)} [label=${JSON.stringify(nodeLabel)}, group=${JSON.stringify(node.kind)}];`,
          );
        }
        renderScope(child, indent + "  ");
        lines.push(`${indent}}`);
      } else if (isNode) {
        const node = graph.nodes.get(child)!;
        const nodeLabel = `<${node.kind}>\n${label}`;
        lines.push(
          `${indent}${JSON.stringify(child)} [label=${JSON.stringify(nodeLabel)}, group=${JSON.stringify(node.kind)}];`,
        );
      }
    }
  };

  renderScope("", "  ");

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
