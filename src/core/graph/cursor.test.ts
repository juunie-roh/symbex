import { beforeEach, describe, expect, it } from "vitest";

import { NodeId, NodePath } from "@/models";

import GraphCursor from "./cursor";
import Graph from "./graph";

const makeRange = (start: number, end: number) => ({
  startIndex: start,
  endIndex: end,
  startPosition: { row: 0, column: start },
  endPosition: { row: 0, column: end },
});

const graph = new Graph(
  [
    {
      path: ["file.ts"] as NodePath,
      kind: "module",
      type: "scope",
      blockStartIndex: 0,
      at: { name: "file.ts" },
    },
    {
      path: ["file.ts", "Foo", "bar"] as NodePath,
      kind: "method",
      type: "scope",
      blockStartIndex: 26,
      at: makeRange(20, 50),
    },
    {
      path: ["file.ts", "Foo"] as NodePath,
      kind: "class",
      type: "scope",
      blockStartIndex: 19,
      at: makeRange(10, 80),
    },
    {
      path: ["file.ts", "Foo", "x"] as NodePath,
      kind: "member",
      type: "binding",
      at: makeRange(53, 58),
    },
    {
      path: ["file.ts", "x"] as NodePath,
      kind: "variable",
      type: "binding",
      at: makeRange(60, 75),
    },
    {
      path: ["file.ts", "React"] as NodePath,
      kind: "import",
      type: "binding",
      at: { name: "react" },
    },
  ],
  [
    {
      from: ["file.ts"] as NodePath,
      to: ["file.ts", "Foo"] as NodePath,
      kind: "defines",
    },
    {
      from: ["file.ts", "Foo"] as NodePath,
      to: ["file.ts", "Foo", "bar"] as NodePath,
      kind: "defines",
    },
    {
      from: ["file.ts", "Foo"] as NodePath,
      to: ["file.ts", "Foo", "x"] as NodePath,
      kind: "defines",
    },
    {
      from: ["file.ts"] as NodePath,
      to: ["file.ts", "x"] as NodePath,
      kind: "defines",
    },
    {
      from: ["file.ts"] as NodePath,
      to: ["file.ts", "React"] as NodePath,
      kind: "imports",
    },
  ],
);

describe("Graph Cursor", () => {
  let cursor: GraphCursor;

  beforeEach(() => {
    cursor = new GraphCursor(graph, graph.nodes.values().toArray()[0].id);
  });

  describe("node", () => {
    it("returns the node at the current id", () => {
      expect(cursor.node?.kind).toBe("module");
    });

    it("throws for an unknown id", () => {
      const unknown = new GraphCursor(graph, "ghost" as unknown as NodeId);
      expect(() => unknown.node).toThrow();
    });
  });

  describe("path", () => {
    it("returns path segments for the current node", () => {
      expect(cursor.path).toEqual(["file.ts"]);
    });
  });

  describe("depth", () => {
    it("returns 0 for root node", () => {
      expect(cursor.depth).toBe(0);
    });

    it("returns correct depth for nested nodes", () => {
      const [foo] = cursor.children();
      expect(foo.depth).toBe(1);

      const [bar] = foo.children();
      expect(bar.depth).toBe(2);
    });
  });

  describe("parent()", () => {
    it("returns undefined for root node", () => {
      expect(cursor.parent()).toBeUndefined();
    });

    it("returns a cursor pointing to the parent", () => {
      const [foo] = cursor.children();
      const parent = foo.parent();
      expect(parent?.path).toEqual(["file.ts"]);
    });

    it("chains back to root from a deeply nested node", () => {
      const [foo] = cursor.children();
      const [bar] = foo.children();
      expect(bar.parent()?.path).toEqual(["file.ts", "Foo"]);
    });
  });

  describe("children()", () => {
    it("returns all children without filter", () => {
      expect(cursor.children()).toHaveLength(3);
    });

    it("filters children by edge kind", () => {
      expect(cursor.children("defines")).toHaveLength(2);
      expect(cursor.children("imports")).toHaveLength(1);
    });

    it("returns empty array for unknown edge kind", () => {
      expect(cursor.children("extends")).toHaveLength(0);
    });

    it("returns empty array for leaf node", () => {
      const [foo] = cursor.children();
      const [bar] = foo.children();
      expect(bar.children()).toHaveLength(0);
    });
  });

  describe("nearest()", () => {
    it("returns self when predicate matches self", () => {
      const result = cursor.nearest((c) => c.node?.kind === "module");
      expect(result?.path).toEqual(["file.ts"]);
    });

    it("walks up to a matching ancestor", () => {
      const [foo] = cursor.children();
      const [bar] = foo.children();
      const result = bar.nearest((c) => c.node?.kind === "module");
      expect(result?.path).toEqual(["file.ts"]);
    });

    it("stops at the first matching ancestor (not the deepest)", () => {
      const [foo] = cursor.children();
      const [bar] = foo.children();
      const result = bar.nearest((c) => c.node?.kind === "class");
      expect(result?.path).toEqual(["file.ts", "Foo"]);
    });

    it("returns undefined when no ancestor matches", () => {
      expect(cursor.nearest(() => false)).toBeUndefined();
    });
  });

  describe("resolve()", () => {
    it("resolves a direct child by name", () => {
      const result = cursor.resolve("Foo");
      expect(result?.path).toEqual(["file.ts", "Foo"]);
    });

    it("resolves a symbol from within a nested scope", () => {
      const [foo] = cursor.children();
      expect(foo.resolve("bar")?.path).toEqual(["file.ts", "Foo", "bar"]);
    });

    it("resolves the nearest (shadowing) binding when the same name exists in an outer scope", () => {
      const [foo] = cursor.children();
      const [bar] = foo.children();
      // Foo.x (depth 2) shadows file-level x (depth 1) from inside bar
      expect(bar.resolve("x")?.path).toEqual(["file.ts", "Foo", "x"]);
    });

    it("resolves a file-scope symbol that is not shadowed", () => {
      // from file.ts, "x" refers to the file-level binding directly
      expect(cursor.resolve("x")?.path).toEqual(["file.ts", "x"]);
    });

    it("returns undefined for an unknown symbol", () => {
      expect(cursor.resolve("DoesNotExist")).toBeUndefined();
    });
  });

  describe("at()", () => {
    it("returns undefined when no node covers the offset", () => {
      expect(GraphCursor.at(graph, 200).depth).toEqual(0);
    });

    it("returns the deepest node covering the offset", () => {
      // offset 30 is inside Foo (10-80) and bar (20-50)
      const c = GraphCursor.at(graph, 30);
      expect(c.path).toEqual(["file.ts", "Foo", "bar"]);
    });

    it("returns a shallower node when offset is outside deeper nodes", () => {
      // offset 15 is inside Foo (10-80) but not bar (20-50)
      const c = GraphCursor.at(graph, 15);
      expect(c.path).toEqual(["file.ts", "Foo"]);
    });

    it("returns undefined when offset falls outside all ranged nodes", () => {
      // offset 90 is outside Foo (10-80), bar (20-50), and x (60-75); file.ts uses NodeSource and is skipped
      const c = GraphCursor.at(graph, 90);
      expect(c.depth).toEqual(0);
    });

    it("includes a node whose startIndex equals the offset", () => {
      // offset 10 is the inclusive start of Foo (10-80); bar starts at 20
      expect(GraphCursor.at(graph, 10).path).toEqual(["file.ts", "Foo"]);
    });

    it("includes a node whose endIndex equals the offset", () => {
      // offset 80 is the inclusive end of Foo (10-80); bar ends at 50
      expect(GraphCursor.at(graph, 80).path).toEqual(["file.ts", "Foo"]);
    });
  });
});
