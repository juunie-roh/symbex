import TSParser from "tree-sitter";

import { QueryError } from "./error";

class QueryMap<K extends string = string> extends Map<K, TSParser.Query> {
  private _language: TSParser.Language;

  constructor(language: TSParser.Language) {
    super();
    this._language = language;
  }

  set(key: K, value: string): this;
  set(key: K, value: TSParser.Query): this;
  set(key: K, value: string | TSParser.Query): this {
    if (super.has(key)) {
      throw new QueryError(
        "QUERY_DUPLICATE_KEY",
        `The key name ${key} already exists`,
      );
    }

    if (typeof value === "string") {
      const query = new TSParser.Query(this._language, value);
      this.set(key, query);
    } else {
      super.set(key, value);
    }

    return this;
  }

  get(key: K): TSParser.Query {
    if (!super.has(key)) {
      throw new QueryError("QUERY_INVALID_KEY", `No query found named ${key}`);
    }

    return super.get(key)!;
  }

  match(key: K, node: TSParser.SyntaxNode, parentTypesToInclude?: string[]) {
    const matches = this.get(key).matches(node);

    return matches.filter((match) =>
      match.captures.some(
        (captured) =>
          captured.node.parent?.id === node.id ||
          parentTypesToInclude?.some(
            (type) => type === captured.node.parent?.type,
          ),
      ),
    );
  }
}

export { QueryMap };
