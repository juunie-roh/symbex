import type { Graph } from "@/core/graph";

function edgesToDOT(edges: Graph["edges"], space?: number): string[] {
  const lines: string[] = [];
  for (const [from, toMap] of edges) {
    for (const [to, kinds] of toMap) {
      for (const kind of kinds) {
        lines.push(
          `${indent(space)}${JSON.stringify(from)} -> ${JSON.stringify(to)} [label=${JSON.stringify(kind)}];`,
        );
      }
    }
  }
  return lines;
}

function indent(space?: number): string {
  return " ".repeat(space ?? 0);
}

export { edgesToDOT };
