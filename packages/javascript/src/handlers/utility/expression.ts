import type Parser from "tree-sitter";

import flatPattern from "./pattern";

const dispatcher: Record<string, typeof flatExpression> = {
  /**
   * Get text from plain identifier node.
   */
  identifier: (node) => [node.text],

  expression_statement: (node) => {
    return flatExpression(node.firstNamedChild!);
  },

  assignment_expression: (node) => {
    const left = node.childForFieldName("left")!;
    const right = node.childForFieldName("right")!;

    const leftResult: string[] =
      left.type === "identifier" ||
      left.type === "member_expression" ||
      left.type === "parenthesized_expression" ||
      left.type === "subscript_expression"
        ? flatExpression(left)
        : flatPattern(left).flatMap((v) => v.name);

    return [...leftResult, ...flatExpression(right)];
  },

  augmented_assignment_expression: (node) =>
    flatExpression(node.childForFieldName("left")!),

  await_expression: (node) => flatExpression(node.firstNamedChild!),

  binary_expression: (node) => [
    ...flatExpression(node.childForFieldName("left")!),
    ...flatExpression(node.childForFieldName("right")!),
  ],
  // TODO: jsx_element
  // TODO: jsx_self_closing_element
  new_expression: (node) => [
    ...flatExpression(node.childForFieldName("constructor")!),
    ...flatExpression(node.childForFieldName("arguments")!),
  ],
  // primary_expressions
  // primary_expression > call_expression
  call_expression: (node) => {
    const func = node.childForFieldName("function")!;
    return [
      ...(func.type === "import" ? [] : flatExpression(func)),
      ...flatExpression(node.childForFieldName("arguments")!),
    ];
  },
  // primary_expression > member_expression
  member_expression: (node) => {
    const obj = node.childForFieldName("object")!;
    return obj.type === "import" ? [] : flatExpression(obj);
  },
  // primary_expression > parenthesized_expression
  parenthesized_expression: (node) => flatExpression(node.firstNamedChild!),
  // primary_expression > subscript_expression
  subscript_expression: (node) => [
    ...flatExpression(node.childForFieldName("object")!),
    ...flatExpression(node.childForFieldName("index")!),
  ],
  // primary_expression > template_string
  template_string: (node) =>
    node.namedChildren
      .filter((c) => c.type === "template_substitution")
      .flatMap((c) => c.namedChildren.flatMap((n) => flatExpression(n))),

  ternary_expression: (node) => [
    ...flatExpression(node.childForFieldName("condition")!),
    ...flatExpression(node.childForFieldName("consequence")!),
    ...flatExpression(node.childForFieldName("alternative")!),
  ],

  unary_expression: (node) =>
    flatExpression(node.childForFieldName("argument")!),

  update_expression: (node) =>
    flatExpression(node.childForFieldName("argument")!),

  yield_expression: (node) =>
    node.namedChildren.flatMap((c) => flatExpression(c)),

  arguments: (node) => {
    const children = node.namedChildren;
    if (!children || children.length <= 0) return [];
    return children.flatMap((c) => {
      if (c.type === "spread_element")
        return flatExpression(c.firstNamedChild!);
      return flatExpression(c);
    });
  },
};

function flatExpression(node: Parser.SyntaxNode): string[] {
  return dispatcher[node.type]?.(node) ?? [];
}

export default flatExpression;
