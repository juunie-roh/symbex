import type Graph from "@/core/graph";
import type { NodeId } from "@/models";

type Serialized = ReturnType<Graph["serialize"]>;

type DotGraphOptions = {
  name?: string;
  rankdir?: "TB" | "LR" | "BT" | "RL";
  indent?: number;
};

function printDotGraph(
  graph: Serialized,
  { name = "letant", rankdir = "TB", indent: space = 0 }: DotGraphOptions,
) {
  const lines: string[] = [
    `digraph ${JSON.stringify(name)} {`,
    `${indent(space)}rankdir=${rankdir};`,
    `${indent(space)}compound=true;`,
    `${indent(space)}newrank=true;`,
    `${indent(space)}splines=spline;`,
    `${indent(space)}graph [fontname="JetBrains Mono" fontsize=12 pad=0.3]`,
    `${indent(space)}node [fontname="JetBrains Mono" shape=box style="rounded"]`,
    `${indent(space)}edge [fontname="JetBrains Mono" fontsize=8 color="#666"]`,
  ];

  lines.push(...nodesToDOT(graph.nodes, space));
  lines.push(...edgesToDOT(graph.edges, space));

  lines.push("}");
  return lines.join(space === 0 ? "" : "\n");
}

type TrieNode = { id?: NodeId; children: Map<string, TrieNode> };

function nodesToDOT(nodes: Serialized["nodes"], space: number): string[] {
  const lines: string[] = [];

  // Build a trie over path segments to resolve parent ids by element comparison
  const trie: TrieNode = { children: new Map() };
  for (const node of nodes) {
    let cur = trie;
    for (const seg of node.path) {
      if (!cur.children.has(seg))
        cur.children.set(seg, { children: new Map() });
      cur = cur.children.get(seg)!;
    }
    cur.id = node.id;
  }

  const parentId = (
    path: (typeof nodes)[number]["path"],
  ): NodeId | undefined => {
    let cur = trie;
    for (let i = 0; i < path.length - 1; i++) {
      cur = cur.children.get(path[i])!;
    }
    return cur.id;
  };

  // Build children map keyed by NodeId (null = root)
  type N = (typeof nodes)[number];
  const childrenOf = new Map<NodeId | null, N[]>();
  childrenOf.set(null, []);

  for (const node of nodes) {
    const pid = node.path.length <= 1 ? null : (parentId(node.path) ?? null);
    if (!childrenOf.has(pid)) childrenOf.set(pid, []);
    childrenOf.get(pid)!.push(node);
  }

  const renderNode = (node: N, spc: number): void => {
    const label = node.path[node.path.length - 1] ?? node.id;
    const children = childrenOf.get(node.id) ?? [];
    const isScope = node.type !== "binding";

    if (isScope) {
      lines.push(
        `${indent(spc)}subgraph ${JSON.stringify("cluster_" + node.id)} {`,
      );
      lines.push(`${indent(spc + space)}label=${JSON.stringify(label)};`);
      lines.push(
        `${indent(spc + space)}${JSON.stringify(node.id)} [label=${JSON.stringify(`<${node.kind}>\n${label}`)}, group=${JSON.stringify(node.kind)}, tooltip=${JSON.stringify(node.path.join(" > "))}];`,
      );
      for (const child of children) {
        renderNode(child, spc + space);
      }
      lines.push(`${indent(spc)}}`);
    } else {
      lines.push(
        `${indent(spc)}${JSON.stringify(node.id)} [label=${JSON.stringify(`<${node.kind}>\n${label}`)}, group=${JSON.stringify(node.kind)}, tooltip=${JSON.stringify(node.path.join(" > "))}, shape=underline];`,
      );
    }
  };

  for (const root of childrenOf.get(null) ?? []) {
    renderNode(root, space);
  }

  const moduleIds = [...nodes]
    .filter((node) => node.kind === "module")
    .map((node) => JSON.stringify(node.id));
  if (moduleIds.length > 0) {
    lines.push(`${indent(space)}{ rank=min; ${moduleIds.join("; ")}; }`);
  }

  return lines;
}

function edgesToDOT(edges: Serialized["edges"], space: number): string[] {
  const lines: string[] = [];

  for (const edge of edges) {
    const { from, to, kind } = edge;

    lines.push(
      `${indent(space)}${JSON.stringify(from)} -> ${JSON.stringify(to)} [label=${JSON.stringify(kind)}];`,
    );
  }

  return lines;
}

function indent(space: number): string {
  return " ".repeat(space);
}

export { printDotGraph };
