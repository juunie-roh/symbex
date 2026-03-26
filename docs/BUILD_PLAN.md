# letant: Structural Code Comprehension

## Origin

This idea emerged from hands-on experience with the markdown processing pipeline in juun.vercel.app. The blog system's content pipeline is an AST transformation chain:

```text
Markdown String
  ↓ gray-matter (extract frontmatter)
Markdown AST (mdast)
  ↓ remark-gfm
Enhanced Markdown AST (tables, strikethrough, etc.)
  ↓ remark-rehype
HTML AST (hast)
  ↓ rehype-raw → rehype-unwrap-images
Processed HTML AST
  ↓ rehype-react (with custom component mappings)
React Elements (JSX)
```

This pipeline never treats markdown as text after the initial parse. Every transformation — mapping anchors to Next.js Links, images to optimized Next.js Image components with aspect ratio wrappers, code blocks to syntax-highlighted CodeBlocks — happens at the tree level. String matching couldn't perform these structural transformations.

Working with this daily produced the insight: if operating on ASTs is fundamentally more precise and efficient for content transformation, why does AI still retrieve code as text?

The idea was not derived from compiler theory or academic research. It was a cross-domain pattern transfer: a practical content pipeline problem → structural insight about ASTs → recognition that the same principle applies to code retrieval.

## The Problem

Current AI code assistants retrieve code through text-based search — semantic similarity on token sequences. This means:

- Search matches on lexical proximity, not computational structure
- The AI re-parses text into structural understanding on every retrieval
- Results include noise: code that *mentions* a concept vs. code that *performs* it

## What letant Is

letant is a structural code comprehension tool. It answers one question on demand: **where did this come from?**

Given a position in source code, letant traces the provenance of every symbol the scope depends on — what each name resolves to and where each definition originates. The result is a precise dependency set for that scope: exactly the declarations needed to understand the implementation, nothing more.

The scope graph is the mechanism, not the product. The product is a set of resolved cursors pointing to the definitions a scope depends on, each carrying a position pointer to load source on demand. The consumer — AI agent, IDE, human — gets precisely the code needed to reason about one piece of implementation.

```text
Current:   AI → text search → fuzzy text matches → AI re-parses into understanding
letant:    AI → scope graph → provenance trace → precise dependency set
```

### A Different Question

Every other tool in this space asks "where is this symbol and who uses it?" — a cartographic question that requires mapping everything. letant asks "where did this come from?" — a genealogical question that requires only following the lineage of what you're looking at.

This follows the natural direction of code comprehension. When you read code, you encounter a symbol and look up where it came from. You never pause mid-reading to ask "who else uses this across the codebase." That's a different task (impact analysis), not comprehension.

Other tools optimized for bidirectional resolution — "find definition" and "find all references." Both directions require indexing every reference occurrence. letant only traces forward: from usage to origin. This requires only declaration indexing, not reference indexing. The graph is smaller, resolution is cheaper, and results are precise to the scope you're in.

### Composable with Search Tools

letant doesn't need its own "find" capability. It sits downstream of search tools:

- **ast-grep** finds *where* something is (structural pattern match)
- **letant** explains *what it depends on* (provenance trace)

The integration surface is a file path and a byte offset. ast-grep gives a location. letant takes that location and traces its dependency chain.

## The Comprehension Loop

Parsing a file produces two things: a `Graph` (the declaration skeleton) and a `Tree` (the raw AST). The graph records what exists. The tree retains implementation detail. The `at: Range` on each graph node bridges them.

```text
graph node (at: Range)
  → tree.rootNode.descendantForIndex(start, end)
  → tree-sitter SyntaxNode
  → implementation body
  → getReferences(body)           [plugin-provided]
  → string[] of referenced names
  → cursor.resolve(name) for each
  → set of dependency cursors
```

1. Start at a node in the graph (via `atPosition()` from a byte offset)
2. Use `at: Range` to reach into the tree for the implementation subtree
3. Run `getReferences()` — a plugin-provided function that walks the AST and extracts every referenced identifier (e.g. `flatExpression` for JavaScript)
4. Pass each name to `cursor.resolve()` — scope-walk finds the declaration
5. Each resolved cursor is a dependency. Its `at` tells the consumer what to do next:
   - `Range` → read the source at that position
   - `NodeSource` → follow the import path, parse that file on demand, continue

The consumer decides the depth. One hop gives direct dependencies. Following those gives transitive dependencies. The graph never loads code the consumer didn't ask about.

### Why Graph + Tree

The graph and tree serve different purposes and neither duplicates the other:

- **Graph**: structure and resolution. What scopes and bindings exist, how they nest, how names resolve through the scope chain. Declaration-only — no implementation detail.
- **Tree**: implementation detail. The full AST for reading function bodies, extracting referenced identifiers, accessing source text. Retained from the same parse that produced the graph.

`Parser.parse()` returns `{ graph, tree }`. Both are products of one parse. The consumer holds the pair. The parser stays stateless.

## The Scope Graph

The scope graph is the structural index that enables comprehension. Every query, handler, and bypass performs the same fundamental operation: identifying scope boundaries and extracting the names introduced within them.

A **scope** is a region of code where names are valid — a file, a function body, a class body, a block.

A **binding** is a name introduced into a scope — a variable declaration, a function name, a parameter, an import.

Some constructs are both: a function introduces a name into its parent scope (binding) and creates a new scope in which its own parameters and local declarations live (scope).

The `defines` edge is the scope-to-binding relationship. The graph is a scope containment tree.

### Node Roles

| Role | Description | Current `kind` values |
| ---- | ----------- | --------------------- |
| **Scope + binding** | Introduces names AND is introduced into a parent scope | `function`, `class`, `method`, `abstract_class` |
| **Pure binding** | Gets introduced, doesn't introduce names | `variable`, `member`, `import`, `abstract_method` |
| **Anonymous scope** | Introduces names but has no binding identity of its own | (planned: `if`, `switch`, `for`, `while`) |

The file itself is the root scope — the implicit root of the path hierarchy.

### Data Model

```ts
type NodeSource = { name: string; external?: boolean };

interface Node<K extends string = string> {
  path: NodePath;          // scope-chain segments, e.g. ["src/utils/parse.ts", "parseDate"]
  kind: K;
  type: "scope" | "anonymous" | "binding";
  at: Parser.Range | NodeSource;  // position in file, OR source module for imports
  props?: Record<string, unknown>;  // language-specific, core carries but does not interpret
}

interface Edge<K extends string = string> {
  from: NodePath;
  to: NodePath;
  kind: K;
  props?: Record<string, unknown>;
}
```

The `at` field is a discriminated union:

- **Local declarations** carry a `Range` — the position in file. The comprehension loop uses this to bridge into the tree.
- **Import bindings** carry a `NodeSource` — the module specifier, with `external` flag. `external: true` is a hard stop (package dependency, no file to resolve). `external: false` means follow the path to another file.

Node IDs use scope-chain path arrays hashed via `HashRegistry` (SHA-256 truncated) for O(1) bidirectional lookup.

### Semantic Declarations, Not Grammar Artifacts

Declarations are classified by what they semantically *are*, not how the parser represents them:

- `function f() {}` and `const f = () => {}` both produce `kind: "function"` nodes
- `function f() {}` and `const f = function() {}` both produce `kind: "function"` nodes
- Assigned arrow functions in class bodies produce `kind: "method"` nodes

### Import Model: Bindings with Provenance

Import bindings are first-class nodes carrying source provenance in `at`:

```ts
// import { foo as bar } from "./module"
{
  path: ["file.ts", "bar"],
  kind: "variable",
  type: "binding",
  at: { name: "./module", external: false },
  props: { alias_of: "foo" }
}
```

The `imports` edge goes from parent scope to import binding, same direction as `defines`. No separate module nodes. The graph contains only things that actually exist as bindings or scopes in the source.

## Graph Cursor

The `GraphCursor` is the primary interface for comprehension. It serves as:

1. **Navigation primitive**: `parent()`, `children()`, `nearest()` for walking the scope tree.
2. **Resolution engine**: `resolve(symbol)` walks the scope chain to find where a name was declared.
3. **Dependency tracer**: Each resolved cursor *is* a dependency. The collection accumulated during comprehension is the dependency set.
4. **IDE sync point**: `atPosition(graph, offset)` maps a source position to the deepest graph node — the entry point from a file location into the structural world.

```ts
class GraphCursor {
  parent(): GraphCursor | undefined;
  children(edgeKind?: string): GraphCursor[];
  nearest(predicate: (cursor: GraphCursor) => boolean): GraphCursor | undefined;
  resolve(symbol: string): GraphCursor | undefined;
  static atPosition(graph: Graph, offset: number): GraphCursor | undefined;

  get node(): GraphNode;
  get path(): NodePath;
  get depth(): number;
}
```

`resolve()` walks up the scope chain via `nearest()`, finds the first ancestor scope that contains a child with the matching name, and returns the *child* cursor (the binding). In cross-file resolution, when it hits an import binding with a `NodeSource` in `at`, it follows the source path to load the target file's graph and continues there.

## Plugin Architecture

A language plugin has two responsibilities:

1. **Declaration extraction** — identify scopes and bindings from source (the `capture/convert` pipeline)
2. **Reference extraction** — identify referenced identifiers from implementation bodies (`getReferences`)

These are separate concerns. Declaration extraction builds the graph. Reference extraction reads the tree. Both are language-specific.

### Plugin Descriptor

```ts
type Plugin.Descriptor = {
  language: Parser.Language;
  query: QueryMap;
  captureConfig: CaptureConfig;
  convertConfig: ConvertConfig;
  references: (body: Parser.SyntaxNode) => string[];  // reference extraction
};
```

`references` is a pure function that walks a tree-sitter subtree (typically a function/method body) and returns all referenced identifier names. For JavaScript, this is `flatExpression` — it recurses through expression node types, bottoming out at `identifier` nodes that represent scope-walk targets. `member_expression` only recurses into the object (root reference), not the property — `foo.bar.baz` yields `["foo"]`.

### Capture / Convert Pipeline

**`capture()`** — runs tree-sitter queries against AST nodes and returns typed match results. Faithful extraction — no filtering or semantic interpretation.

**`convert()`** — transforms captures into graph nodes and edges. Semantic decisions: what kind of node, what edges, whether to recurse into child scopes.

Both are created via core factory functions (`createCapture`, `createConvert`) that wire together configuration, type safety, and recursive composition.

### Depth-Gated Query Execution

Queries are executed with `maxStartDepth` control:

- `maxStartDepth: 0` — destructure the target node itself.
- `maxStartDepth: 1` — match direct children (default).
- `maxStartDepth: unlimited` — full subtree traversal (opt-in).

### Bypass Mechanism

Export wrappers place declarations at unreachable depth. The bypass pierces them — a single parameterized `bypassExport(queryKey)` function handles all export forms. Adding bypass support for a new construct is just `bypass: bypassExport("newTag")` in the capture config.

### Plugin File Structure

```text
packages/<lang>/
  src/
    queries/           ← .scm files, one per construct
    handlers/          ← convert handlers, one per query tag
    references/        ← getReferences implementation (flatExpression, flatPattern)
    types.ts           ← QueryConfig, Node, Edge type aliases
    query.ts           ← QueryMap instances (main + bypass)
    capture.ts         ← CaptureConfig with bypass wiring
    convert.ts         ← ConvertConfig with handler registration
    index.ts           ← plugin exports (descriptor)
```

### Core Infrastructure

- **`Parser`** — maps file extensions to plugins, dispatches `parse(filePath, source)` → `{ graph: Graph, tree: Tree }`.
- **`Graph`** — declaration-only scope containment tree. `HashRegistry` for O(1) path↔id lookup. Supports `parent()`, `depth()`, `path()`, `adjacent()`, `serialize()`.
- **`GraphCursor`** — immutable traversal and resolution over `Graph`.
- **`QueryMap`** — typed query compilation and depth-gated matching.
- **`createCapture` / `createConvert`** — factory functions with full type enforcement.
- **`scmPlugin`** — esbuild plugin for `.scm` normalization at build time.

## Key Design Decisions

### Declaration-Only Graph

letant does not index references. Only declarations (bindings) are stored. References are extracted on demand from the tree via `getReferences()` and resolved through the scope chain. This is not a missing feature — it's the core design. Forward provenance tracing doesn't need reference indexing.

### Graph Is the Medium, Not the Output

The scope graph enables comprehension but isn't what the consumer receives. The consumer receives a set of resolved cursors — the dependency set for a scope. The graph is the structural index that makes precise resolution possible. The tree is the implementation detail that makes reference extraction possible. Together they produce the comprehension result.

### Export Statements Are Transparent Wrappers

The bypass mechanism pierces exports to extract the actual declaration. `export class Foo {}` and `class Foo {}` produce identical graph structures.

### False Edges Are Worse Than Absent Ones

Call edges, type resolution, and other compiler-level analysis are not attempted. Edges that might be wrong degrade trust more than edges that are missing.

### Queries Return Data, Navigation Returns Cursors

The cursor is a traversal primitive. The comprehension loop uses cursors internally but the final output — the dependency set — is data about which nodes the scope depends on and where they originate.

## Current State of the Field (as of Mar 2026)

### What exists

- **Stack Graphs (GitHub)** — Bidirectional resolution machines. Index both definitions and references. Find paths from reference nodes to definition nodes via symbol stack path-finding. Optimized for "go to definition" and "find all references." File-incremental, stored in SQLite. Language support requires complex `.tsg` rule files.
- **ast-grep** — Structural pattern matching. No persistent index, no relational model. Finds where patterns occur. Doesn't explain what they depend on.
- **Sourcegraph Cody** — AI assistant with code search backend. Structural knowledge implicit in the index, not exposed as a queryable artifact.
- **Meta's Glean** — Structured fact store with declarative query language. Right shape but practically inaccessible in OSS.
- **LSP** — Compiler-powered symbol resolution. Accurate, heavy, requires build configuration and language-specific servers.
- **AI coding tools** — Most use text search, embeddings, or file dumps. No persistent structural graph. Emerging consensus that hybrid indexing (AST/code graph + vector search) is needed, but the structural half doesn't exist as a pluggable component.

### How letant differs

These tools answer "where is this symbol and who uses it?" — bidirectional, exhaustive, pre-indexed. letant answers "where did this come from?" — forward-only, on-demand, scoped to what you're looking at.

Stack graphs index every reference and definition, then find paths between them. letant indexes only declarations, extracts references on demand from source, and resolves them through scope walk. The graph is smaller, the resolution is cheaper, and the output is precise to one scope.

ast-grep finds where things are. letant explains what they depend on. They compose: ast-grep gives a location, letant traces its provenance.

No existing tool is optimized for forward provenance tracing as its primary operation.

## Scope: What This Is Not

- Not bidirectional reference resolution ("find all references")
- Not compiler-level type analysis
- Not a code search engine (composable with search tools instead)
- Not cross-file call graph construction
- Not anonymous function / IIFE tracking
- Not a replacement for LSP

## Roadmap

### Phase 1: Single-File Comprehension

Build the scope graph and comprehension loop for a single file. Declaration extraction via capture/convert. Reference extraction via `getReferences`. Resolution via cursor scope walk. Parser returns `{ graph, tree }`.

**JavaScript is the primary language target** — TypeScript's surface area (dual namespaces, type-level constructs, ambient declarations) is too large for Phase 1. TypeScript can be added later as an incremental extension.

**Implemented:** imports (with `NodeSource` provenance and `external` flag), functions (including arrow/generator/expression forms), classes (including heritage, generics, abstract), methods, members, variables, destructuring patterns (`flatPattern`). `GraphCursor` for traversal and resolution. Consolidated `bypassExport()`. CLI with DOT output, JSON serialization, and `query` subcommand.

**In progress:** `getReferences` (`flatExpression`) for JavaScript expression walking. `Parser.parse()` returning `{ graph, tree }`.

**Remaining:** Parameters as scope bindings. Pipeline integration tests (real file → parse → graph + tree → cursor → resolve → correct dependency set).

### Phase 2: Cross-File Comprehension

Cross-file resolution is lazy. The same scope-walk mechanism gains one new behavior: when resolution hits an import binding with a `NodeSource` in `at`, it follows the source path, parses the target file on demand, loads its graph, and continues resolution there.

Import resolution patterns for JS:

- **Named import**: look up symbol by original name from source graph root. One hop.
- **Namespace import**: member access `ns.foo` resolves `foo` from source graph root. Same as named.
- **Default import**: find the default-exported declaration in the source file.

These collapse into two patterns: look up a specific name from root (named + namespace), and find the default.

The consumer holds a `Map<filePath, { graph, tree }>` as a lazy cache. Each file loaded on demand contributes its pair. The parser stays stateless.

Other languages are simpler than JS — Python, Go, Rust, and Java all collapse into "look up a name from the module root" with no default export concept. C/C++ `#include` is text substitution, requiring a fundamentally different strategy.

### Phase 3: Project-Wide Dependency Network

Each node's one-depth provenance trace connects to other nodes, whose traces connect to more. Accumulated across a project, this produces the full scope-level dependency network — not file-level imports, but how individual scopes relate through actual usage.

This network reveals architectural properties invisible from file trees:

- **Clusters** of tightly coupled scopes are natural modules (regardless of file boundaries)
- **High fan-in nodes** are critical shared infrastructure
- **High fan-out nodes** are orchestrators
- **Isolated subgraphs** are independent features
- **A scope depending on 15 files** is a code smell
- **Mutual dependency clusters** are extraction candidates

The network doesn't require a separate analysis pass. It's the same one-depth comprehension loop run everywhere. Each trace is independent. Run lazily, cache results, and the network assembles itself incrementally as the codebase is explored.

Additional Phase 3 concerns: ESLint-style local server architecture, persistent graph storage, IDE-linked clustered graph navigator with progressive disclosure, MCP server for AI agent integration.

## Validation

Real-world JavaScript files (lodash.js for IIFE/CommonJS, three.module.js for ESM) serve as end-to-end validation. The comprehension loop should: parse the file → build graph + tree → pick a function → run getReferences on its body → resolve each name → confirm each cursor lands on the correct declaration with correct provenance.

## Known Limitations

### JavaScript Plugin

- **Decorators**: Present in the AST but not captured or recorded in node props.
- **Anonymous Functions and IIFEs**: No graph node — no name to bind.
- **`getReferences` coverage**: Expression walking handles common cases. Unhandled expression types silently return `[]` — references are missed, not misattributed. Coverage expands incrementally as real files reveal gaps.

### Architectural

- **No "find all references"**: letant traces forward (usage → origin), not backward (definition → all usages). This is by design — but means impact analysis requires scanning.
- **Single-namespace path identity**: Two declarations with the same name in the same scope collide. Accepted unless real-world frequency justifies encoding namespace into paths.

## Future Considerations

- **MCP server**: Expose the comprehension loop as a Model Context Protocol server for AI agent integration.
- **IDE-linked clustered graph navigator**: Visual graph with progressive disclosure — clustered by file, expandable to declarations, ctrl-click jump-to-definition via `resolve()`.
- **Structural hashing**: Hash AST subtrees for O(1) structural matching and change detection.
- **Abstraction plugins**: Domain-specific lenses (React component tree, NestJS decorator-aware) over the same raw graph.
- **TypeScript extension**: Add type-level constructs (interfaces, type aliases, enums, namespaces) as an incremental layer on top of the JavaScript plugin.

## Open Questions

- Persistent format for the scope graph — JSON, SQLite, FlatBuffers.
- Whether hybrid approaches (scope graph + vector search) outperform either alone for AI context retrieval.
- How to handle C/C++ `#include` — text substitution rather than symbol import.
- Whether the project-wide dependency network should be pre-computed or always assembled on demand.
