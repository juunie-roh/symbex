import { createCanonicalId } from "@juun-roh/spine/utils";

import { capture } from "@/capture";
import type { Capture, Edge, Node } from "@/types";

import { convert } from "./convert";

function convertMethod(
  methods: Capture<"method">[],
  parentId: string,
): { edges: Edge[]; nodes: Node[] } {
  const edges: Edge[] = [];
  const nodes: Node[] = [];

  for (const method of methods) {
    const id = createCanonicalId(parentId, method.name.text);
    edges.push({
      from: parentId,
      to: id,
      kind: "defines",
      resolved: true,
    } satisfies Edge);

    nodes.push({
      id: id,
      kind: "method",
      range: {
        startIndex: method.node.startIndex,
        endIndex: method.node.endIndex,
        startPosition: method.node.startPosition,
        endPosition: method.node.endPosition,
      },

      props: {
        name: method.name.text,
        modifier: method.modifier?.text ?? "public",
        is_static: method.is_static ? true : false,
        is_async: method.is_async ? true : false,
        type_params: method.type_params?.text,
        params: method.params?.text,
        return_type: method.return_type?.text,
      },
    } satisfies Node);

    if (method.body) {
      const nested = convert(capture(method.body), id);
      edges.push(...nested.edges);
      nodes.push(...nested.nodes);
    }
  }

  return { edges, nodes };
}

function convertMember(
  members: Capture<"member">[],
  parentId: string,
): { edges: Edge[]; nodes: Node[] } {
  const edges: Edge[] = [];
  const nodes: Node[] = [];
  for (const member of members) {
    const id = createCanonicalId(parentId, member.name.text);

    edges.push({
      from: parentId,
      to: id,
      kind: "defines",
      resolved: true,
    } satisfies Edge);

    nodes.push({
      id,
      kind: "member",
      range: {
        startIndex: member.node.startIndex,
        endIndex: member.node.endIndex,
        startPosition: member.node.startPosition,
        endPosition: member.node.endPosition,
      },
      props: {
        name: member.name.text,
        modifier: member.modifier?.text,
        is_static: member.is_static ? true : false,
        type: member.type?.text,
      },
    } satisfies Node);
  }

  return { edges, nodes };
}

function convertClasses(
  classes: Capture<"class">[],
  parentId: string,
): {
  edges: Edge[];
  nodes: Node[];
} {
  const edges: Edge[] = [];
  const nodes: Node[] = [];

  if (classes.length > 0) {
    for (const cls of classes) {
      const id = createCanonicalId(parentId, cls.name.text);

      edges.push({
        from: parentId,
        to: id,
        kind: "defines",
        resolved: true,
      } satisfies Edge);

      nodes.push({
        id,
        kind: "class",
        range: {
          startIndex: cls.node.startIndex,
          endIndex: cls.node.endIndex,
          startPosition: cls.node.startPosition,
          endPosition: cls.node.endPosition,
        },
        props: {
          name: cls.name.text,
          type_params: cls.type_params?.text,
          extends: cls.extends?.text,
          implements: cls.implements?.text,
        },
      } satisfies Node);

      if (cls.body) {
        const methods = convertMethod(capture(cls.body, "method"), id);
        const members = convertMember(capture(cls.body, "member"), id);
        edges.push(...methods.edges, ...members.edges);
        nodes.push(...methods.nodes, ...members.nodes);
      }
    }
  }

  return { edges, nodes };
}

export { convertClasses };
