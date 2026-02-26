import Parser, { type Query } from "tree-sitter";

type FuncHit = {
  name?: string;
  generics?: string;
  params?: string;
  returnType?: string;

  node: Parser.SyntaxNode;
  body: Parser.SyntaxNode;

  calls: Parser.SyntaxNode[];
};

type ImportHit = {
  name?: string;
  alias?: string;
  source: string;
  node: Parser.SyntaxNode;
};

export function convert(tree: Parser.Tree, query: Query, file: string) {
  const root = tree.rootNode;

  const functions: FuncHit[] = [];
  const imports: ImportHit[] = [];
  const calls: Parser.SyntaxNode[] = [];

  query.matches(root).forEach((match) => {
    let funcNode: Parser.SyntaxNode | null = null;
    let importNode: Parser.SyntaxNode | null = null;
    let body: Parser.SyntaxNode | null = null;

    const funcInfo: Partial<FuncHit> = { calls: [] };
    const importInfo: Partial<ImportHit> = {};

    for (const cap of match.captures) {
      switch (cap.name) {
        case "function":
          funcNode = cap.node;
          break;
        case "import":
          importNode = cap.node;
          break;
        case "body":
          body = cap.node;
          break;
        case "call":
          if (!isMemberCall(cap.node)) calls.push(cap.node);
          break;
        case "source":
          importInfo.source = cap.node.text;
          break;
        case "alias":
          importInfo.alias = cap.node.text;
          break;
        case "name":
          funcInfo.name = cap.node.text;
          importInfo.name = cap.node.text;
          break;
        default:
          (funcInfo as any)[cap.name] = cap.node.text;
      }
    }

    if (funcNode && body) {
      functions.push({ ...funcInfo, node: funcNode, body, calls: [] });
    }

    if (importNode && importInfo.source) {
      imports.push({
        ...importInfo,
        source: importInfo.source,
        node: importNode,
      });
    }
  });

  // call -> function 매핑
  for (const call of calls) {
    const owner = findInnermostOwner(functions, call);
    if (owner) owner.calls.push(call);
  }

  const functionNodes = functions.map((fn) => ({
    file,
    type: "function",
    range: {
      start: fn.node.startPosition,
      end: fn.node.endPosition,
    },
    container: fn.node.parent?.type !== "program" ? fn.node.parent : null,

    name: fn.name,
    generics: fn.generics,
    params: fn.params,
    returnType: fn.returnType,

    calls: fn.calls.map((c) => ({
      text: c.text,
      range: { start: c.startPosition, end: c.endPosition },
    })),
  }));

  const importNodes = imports.map((imp) => ({
    file,
    type: "import",
    range: {
      start: imp.node.startPosition,
      end: imp.node.endPosition,
    },

    name: imp.name,
    alias: imp.alias,
    source: imp.source,
  }));

  return { functions: functionNodes, imports: importNodes };
}

function contains(body: Parser.SyntaxNode, n: Parser.SyntaxNode) {
  return body.startIndex <= n.startIndex && n.endIndex <= body.endIndex;
}

/**
 * Call이 여러 body에 포함될 수 있음(중첩 함수).
 * 가장 안쪽(= body 범위가 가장 작은) 함수를 선택.
 */
function findInnermostOwner(
  funcs: FuncHit[],
  call: Parser.SyntaxNode,
): FuncHit | null {
  let best: FuncHit | null = null;
  let bestSpan = Infinity;

  for (const f of funcs) {
    if (!contains(f.body, call)) continue;

    const span = f.body.endIndex - f.body.startIndex;
    if (span < bestSpan) {
      best = f;
      bestSpan = span;
    }
  }
  return best;
}

function isMemberCall(call: Parser.SyntaxNode): boolean {
  if (call.type !== "call_expression") return false;

  // exclude optional chaining call
  if (hasAncestor("optional_chain", call)) return true;

  const fn = call.childForFieldName("function");
  if (!fn) return false;

  const base = unwrap(fn);

  // obj.foo()
  if (base.type === "member_expression") return true;

  // optional chaining can be included depending on grammar
  if (base.type === "optional_chain") return true;

  return false;
}

function hasAncestor(type: string, node: Parser.SyntaxNode): boolean {
  let cur = node.parent;
  while (cur) {
    if (cur.type === type) return true;
    cur = cur.parent;
  }
  return false;
}

function unwrap(node: Parser.SyntaxNode): Parser.SyntaxNode {
  let cur = node;
  while (true) {
    if (cur.type === "parenthesized_expression") {
      const inner = cur.namedChild(0);
      if (!inner) break;
      cur = inner;
      continue;
    }
    if (cur.type === "as_expression" || cur.type === "type_assertion") {
      const inner = cur.childForFieldName("expression") ?? cur.namedChild(0);
      if (!inner) break;
      cur = inner;
      continue;
    }
    if (cur.type === "non_null_expression") {
      const inner = cur.namedChild(0);
      if (!inner) break;
      cur = inner;
      continue;
    }
    break;
  }
  return cur;
}
