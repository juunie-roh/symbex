# symbex

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?logo=opensourceinitiative&logoColor=fff)](https://opensource.org/licenses/MIT)

A structural code comprehension tool. symbex parses source files using Tree-Sitter, extracts every scope boundary and name binding, and exposes the result as a queryable scope graph. Given a position in source code, it traces the provenance of every symbol the scope depends on — what each name resolves to and where each definition originates.

The scope graph is the mechanism, not the product. The product is a set of resolved cursors pointing to the definitions a scope depends on, each carrying a position pointer to load source on demand.

```text
Current:   AI → text search → fuzzy text matches → AI re-parses into understanding
symbex:    AI → scope graph → provenance trace → precise dependency set
```

## Purpose

Current code retrieval operates on text. Searches match on lexical proximity; results include code that *mentions* a concept rather than code that *performs* it; structural relationships like inheritance and containment are invisible.

symbex approaches this differently: parse once, index structurally, query structurally. The index stores every scope and every name introduced within it. A scope is a region where names are valid — a file, a function body, a class body. A binding is a name introduced into a scope — a declaration, a parameter, an import. Some constructs are both: a function is introduced into its parent scope and creates a new scope for its own locals.

The output is a **scope graph**: a directed graph where nodes are declarations and scopes, and edges are structural relationships — containment (`defines`), inheritance (`extends`), and module dependencies (`imports`).

### A Different Question

Every other tool in this space asks "where is this symbol and who uses it?" — a cartographic question that requires mapping everything. symbex asks "where did this come from?" — a genealogical question that requires only following the lineage of what you're looking at.

This follows the natural direction of code comprehension. When you read code, you encounter a symbol and look up where it came from. symbex only traces forward: from usage to origin. This requires only declaration indexing, not reference indexing. The graph is smaller, resolution is cheaper, and results are precise to the scope you're in.

### Composable with Search Tools

symbex doesn't need its own "find" capability. It sits downstream of search tools:

- **ast-grep** finds *where* something is (structural pattern match)
- **symbex** explains *what it depends on* (provenance trace)

The integration surface is a file path and a byte offset. ast-grep gives a location. symbex takes that location and traces its dependency chain.

## Architecture

### Data Model

All output is two types:

- **Node** — a code entity with a `path: NodePath` (an array of scope-chain segments, e.g. `["src/utils/parse.ts", "parseDate"]`), hashed to a compact `NodeId` inside the graph. A `kind` classifies the construct, a `type` role classifies its scope behavior, an optional `at` points back to the source location or import provenance, and optional language-specific `props` are carried through opaquely.
- **Edge** — a directed relationship between two nodes (`from` → `to`, both `NodePath`) with a `kind` and optional `props`.

The `at` field is a discriminated union:

- **Local declarations** carry a `Range` — the position in file. The comprehension loop uses this to bridge into the tree.
- **Import bindings** carry a `NodeSource` — the module specifier, with an `external` flag. `external: true` is a hard stop (package dependency, no file to resolve). `external: false` means follow the path to another file.

Node IDs use scope-chain path arrays hashed via `HashRegistry` (SHA-256 truncated) for O(1) bidirectional lookup.

### Node Roles

Every node has a `type` field with one of three values:

| `type` | Description | Example `kind` values |
| ------ | ----------- | --------------------- |
| `"scope"` | A named scope — introduces names and is itself introduced into a parent scope | `function`, `class`, `method` |
| `"anonymous"` | An unnamed scope — introduces names but has no binding identity of its own | `iife`, `if` |
| `"binding"` | A pure binding — is introduced into a scope, does not introduce names | `variable`, `member`, `import`, `parameter` |

### Responsibilities

symbex separates concerns across three layers:

**Language plugin** — interprets the raw Tree-Sitter AST for a specific language. Faithfully extracts every construct the parser exposes and maps it to the common node/edge schema. Two phases:

- `capture` — runs tree-sitter queries against AST nodes and returns typed match results. Complete, no filtering.
- `convert` — transforms captures into graph nodes and edges. Semantic decisions happen here: what kind to assign, what edges to emit, when to recurse into child scopes.

**Core** — owns the schema, the graph, and the cursor API. Receives `Node[]` and `Edge[]` from plugins without knowing anything about the source language. Builds the graph and exposes it for traversal and resolution.

**Abstraction plugin** *(planned)* — a lens over the raw graph. Decides what story to tell from the plugin output: what constructs are promoted to first-class nodes, what gets flattened, what gets excluded. Multiple abstraction plugins can produce different views over the same underlying data.

### The Comprehension Loop

Parsing a file produces two things: a `Graph` (the declaration skeleton) and a `Tree` (the raw AST). The graph records what exists. The tree retains implementation detail. The `at: Range` on each graph node bridges them.

1. Start at a node in the graph (via `GraphCursor.atPosition()` from a byte offset)
2. Use `at: Range` to reach into the tree for the implementation subtree
3. Run `references()` — a plugin-provided function that walks the AST and extracts every referenced identifier
4. Pass each name to `cursor.resolve()` — scope-walk finds the declaration
5. Each resolved cursor is a dependency. Its `at` tells the consumer what to do next:
   - `Range` → read the source at that position
   - `NodeSource` → follow the import path, parse that file on demand, continue

The consumer decides the depth. One hop gives direct dependencies. Following those gives transitive dependencies. The graph never loads code the consumer didn't ask about.

### Graph Cursor

The `GraphCursor` is the primary interface for comprehension:

- **Navigation**: `parent()`, `children()`, `nearest()` for walking the scope tree.
- **Resolution**: `resolve(symbol)` walks the scope chain to find where a name was declared.
- **IDE sync**: `atPosition(graph, offset)` maps a source position to the deepest graph node.

### Plugin System

Each language lives in `packages/<lang>/` as a separate workspace package, loaded at runtime. A plugin exports a `PluginDescriptor`:

```ts
type PluginDescriptor = {
  language: Parser.Language;       // tree-sitter language binding
  query: QueryMap;                   // compiled queries map
  captureConfig: CaptureConfig;      // capture configuration with bypass
  convertConfig: ConvertConfig;      // handler registry
  references(node): string[];        // reference extraction from AST nodes
};
```

Query patterns are written in `.scm` files (Tree-Sitter's query language), one file per construct. Core provides an esbuild plugin (`scmPlugin`) that normalizes and bundles them at build time. Plugins compose a `QueryMap` from these files and wire it into `capture` and `convert` via factory functions from core (`createCapture`, `createConvert`).

**Semantic declarations, not grammar artifacts** — `function f() {}` and `const f = () => {}` both produce `kind: "function"` nodes. Export wrappers are transparent: `export class Foo {}` and `class Foo {}` produce identical graph structures via the bypass mechanism.

### Core Infrastructure

- **`PluginHandler`** — maps file extensions to plugins, dispatches `parse(filePath, source)` → `{ graph, tree }`.
- **`Plugin`** — wraps a tree-sitter parser + plugin module. Runs `capture` → `convert` pipeline.
- **`Graph`** — declaration-only scope containment tree. `HashRegistry` for O(1) path↔id lookup. Supports `parent()`, `depth()`, `path()`, `adjacent()`, `walk()`, `serialize()`.
- **`GraphCursor`** — immutable traversal and resolution over `Graph`.
- **`QueryMap`** — typed query compilation and depth-gated matching.
- **`createCapture` / `createConvert`** — factory functions with full type enforcement.
- **`scmPlugin`** — esbuild plugin for `.scm` normalization at build time.

## Prerequisites

- **Node.js 22+** — Node 22 uses prebuilt Tree-Sitter binaries. Node 24 and 25 build from source and additionally require `python3`, `make`, and `g++` with C++20 support.
- **pnpm** — workspace manager.
- On Node 24/25, set `CXXFLAGS="-std=c++20"` before installing.

## Usage

```bash
# Install dependencies (Node 24/25: prefix with CXXFLAGS="-std=c++20")
pnpm install

# Build core
pnpm build

# Build all packages
pnpm build:all

# Type check everything
pnpm check-types:all

# Run CLI against mock data
pnpm dev:config

# Watch mode
pnpm dev

# Lint
pnpm lint

# Tests
pnpm test
```

To work on the JavaScript plugin:

```bash
pnpm js <script>   # --filter @symbex/javascript
```

### CLI

```bash
symbex <file> --config <path>
```

Options:

| Flag | Description |
| ---- | ----------- |
| `-c, --config <path>` | Config file (required) |
| `-e, --encoding <enc>` | File encoding (default: `utf8`) |
| `-d, --dot [name]` | Output in Graphviz DOT format |
| `-r, --references` | Extract and resolve references |
| `-o, --output <file>` | Write to file instead of stdout |
| `-v, --verbose` | Verbose error output |

## Key Design Decisions

- **Declaration-only graph** — only declarations (bindings) are stored. References are extracted on demand from the tree and resolved through the scope chain. Forward provenance tracing doesn't need reference indexing.
- **Graph is the medium, not the output** — the consumer receives resolved cursors (the dependency set for a scope), not the raw graph.
- **Export statements are transparent** — the bypass mechanism pierces exports to extract the actual declaration.
- **False edges are worse than absent ones** — call edges, type resolution, and other compiler-level analysis are not attempted.

## Roadmap

### Phase 1: Single-File Comprehension *(in progress)*

Build the scope graph and comprehension loop for a single file. JavaScript is the primary language target.

**Implemented:** imports (with `NodeSource` provenance and `external` flag), functions (including arrow/generator/expression forms), classes (including heritage, generics, abstract), methods, members, variables, destructuring patterns, `GraphCursor` for traversal and resolution, export bypass, CLI with DOT output and JSON serialization, reference extraction via `flatExpression`.

**Remaining:** Parameters as scope bindings. Pipeline integration tests (real file → parse → graph + tree → cursor → resolve → correct dependency set).

### Phase 2: Cross-File Comprehension

When resolution hits an import binding with a `NodeSource` in `at`, follow the source path, parse the target file on demand, and continue resolution there. The consumer holds a lazy `Map<filePath, { graph, tree }>` cache. The parser stays stateless.

### Phase 3: Project-Wide Dependency Network

Accumulated provenance traces across a project produce the full scope-level dependency network — how individual scopes relate through actual usage. Reveals clusters, high fan-in/fan-out nodes, isolated subgraphs, and architectural smells.

Additional concerns: persistent graph storage, IDE-linked graph navigator, MCP server for AI agent integration.

## License

[MIT](LICENSE)
