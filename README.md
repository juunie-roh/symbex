# Spine

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?logo=opensourceinitiative&logoColor=fff)](https://opensource.org/licenses/MIT)

An AST-based code indexer for AI assistants. Spine parses source files using Tree-Sitter, extracts structural information as a graph of nodes and edges, and exposes it as a queryable tool — so AI assistants operate on code structure rather than text.

## Why

Current AI code assistants retrieve code through text search: semantic similarity on token sequences. This means results match on lexical proximity, not computational structure, and the AI re-parses text into structural understanding on every retrieval.

The insight behind Spine: if operating on ASTs is fundamentally more precise for code transformation, the same applies to code retrieval. The AI doesn't need to understand the AST — it calls the tool, the tool does structural search, and returns precise results. The same way an AI doesn't need to understand SQL internals to query a database.

```text
Current:   AI → text search → fuzzy text matches → AI re-parses into understanding
Proposed:  AI → Spine → structural matches → AI uses results directly
```

Structural search also removes invalid states from the generation space: if a function isn't in the index, it can't be referenced. This doesn't correct hallucinations after the fact — it prevents them.

## Architecture

### Three Layers

```text
tree-sitter AST
    ↓
[language plugin]       → raw Capture.Result[]  (complete, no opinions)
    ↓
[abstraction plugin]    → shaped Node[] + Edge[]  (opinionated view)
    ↓
[core]                  → builds index, serves queries
```

- **Language plugin**: faithfully converts what tree-sitter gives into the common schema. No filtering, no abstraction decisions.
- **Abstraction plugin**: decides what story to tell from the raw graph. Multiple plugins can produce different views over the same raw data.
- **Core**: owns the schema, the graph, and the query API. Language-agnostic.

The three-way responsibility: *language plugin → what exists, abstraction plugin → what matters, core → what's queryable.*

### Data Model

All output is expressed as two types:

```ts
interface Node {
  id: string;       // unique, human-readable, colon-separated scope
                    // e.g. "src/utils/parse.ts:parseDate"
                    //      "packages/typescript/__mocks__/all.ts:aliased_named_import_4"
  kind: string;
  range?: Range;    // file location pointer
  props?: Record<string, unknown>;  // language-specific, core ignores
}

interface Edge {
  from: Node["id"];
  to: string;       // may be a name (unresolved) or full NodeID (resolved)
  kind: string;
  resolved?: boolean;
  props?: Record<string, unknown>;
}
```

The schema captures vocabulary developers already use — function, class, import, call, dependency. Language-specific constructs live in `props` and are passed through without interpretation.

Imports are first-class: each imported name (or alias) becomes its own `variable` node. The file gets a `defines` edge to that node, and the node gets an `imports` edge to the source module. This makes import relationships queryable as graph structure rather than file metadata — you can ask which file a binding came from, or which bindings reference a given module.

### Core

- **`Parser`** — instantiated with a `Config`, maps file extensions to `Language` instances, dispatches `parse(filePath, source)` to the correct plugin.
- **`Language`** — wraps a Tree-Sitter parser + compiled query for one plugin. `extract()` runs the plugin's `capture()` then `convert()` to produce `{ nodes, edges }`.
- **`Graph`** — built from `{ nodes, edges }` via `Graph.build()`. Unresolved edges (target referenced by name) are resolved at build time by walking the scope chain of the adjacency list. NodeIDs are colon-delimited; resolution walks up scopes until a matching suffix is found.

### Plugin System

Each language is a separate workspace package under `packages/<lang>/`. The only currently validated required export is `language` (tree-sitter binding). Plugins are loaded at runtime via `require(packageName)`.

Query strings are split into per-feature `.scm` files and combined using `merge()` from `@juun-roh/spine/utils/query`:

```ts
// packages/typescript/src/query.ts
const queryString = merge(classQuery, functionQuery, importQuery, ...);
```

### Config

```json
{ "language": [{ "ext": ".ts", "name": "@juun-roh/spine-typescript" }] }
```

## Packages

| Package | Description |
| ------- | ----------- |
| `.` (root) | Core: `Parser`, `Language`, `Graph`, schema, CLI |
| `packages/typescript` | Language plugin for `.ts` files |
| `packages/tsx` | Language plugin for `.tsx` files |

## Usage

```bash
# Install
# for Node 24 or higher, tree-sitter requires c++ or higher to be built
CXXFLAGS="-std=c++20" pnpm install

# Build everything
pnpm build && pnpm -r build

# Run CLI against mock data
pnpm run:dev

# Run against a project
node dist/bin/spine.js -p path/to/spine.config.json path/to/file.ts
```

## Writing a Language Plugin

The interface hasn't settled yet.

## CI

Node 22.x only. Tree-Sitter requires native binaries; prebuilt binaries are available for Node 22. Node 24/25 support is pending upstream.
