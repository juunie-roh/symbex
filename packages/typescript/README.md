# @juun-roh/symbex-typescript

A TypeScript grammar provider plugin for symbex core library.

## Known Limitations

- **Dual Namespace Collisions**: TypeScript has two namespaces—values and types. A class occupies both. An interface occupies only types. A const occupies only values. When an import and a local declaration share the same name across different namespaces, the path model produces a single NodeId and the graph keeps whichever registers last.
- **Import Kind Ambiguity**: Only `import type` and `import { type X }` are explicitly type-only. All other imports are ambiguous — `import { Foo }` could bring in a class (both namespaces), an interface (type only), a function (value only), or any combination. The plugin cannot determine this without resolving the export side.
- **Decorators**: Decorators (`@Injectable()`, `@Component({...})`) are present in the tree-sitter AST but are not captured or recorded in node props.
- **Anonymous Functions and IIFEs**: Anonymous function expressions and immediately-invoked function expressions produce no graph node because they have no name to bind.
