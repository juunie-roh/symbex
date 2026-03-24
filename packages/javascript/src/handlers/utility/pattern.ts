import type Parser from "tree-sitter";

const patterns: Record<string, typeof flatPattern> = {
  identifier: (node, has_default) => [{ name: node.text, node, has_default }],
  shorthand_property_identifier_pattern: (node, has_default) => [
    { name: node.text, node, has_default },
  ],

  rest_pattern: (node, has_default) =>
    flatPattern(node.firstNamedChild!, has_default),
  assignment_pattern: (node) =>
    flatPattern(node.childForFieldName("left")!, true),
  object_assignment_pattern: (node) =>
    flatPattern(node.childForFieldName("left")!, true),
  pair_pattern: (node, has_default) =>
    flatPattern(node.childForFieldName("value")!, has_default),

  array_pattern: (node, has_default) =>
    node.namedChildren.flatMap((c) => flatPattern(c, has_default)),
  object_pattern: (node, has_default) =>
    node.namedChildren.flatMap((c) => flatPattern(c, has_default)),
};

function flatPattern(
  node: Parser.SyntaxNode,
  has_default: boolean = false,
): { name: string; node: Parser.SyntaxNode; has_default?: boolean }[] {
  return patterns[node.type]?.(node, has_default) ?? [];
}

export default flatPattern;
