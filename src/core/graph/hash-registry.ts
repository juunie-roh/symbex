import { createHash } from "crypto";

import type { NodeId, NodePath, NodePathString } from "@/models";

import GraphError from "./error";

/**
 * Bidirectional registry that maps {@link NodePath} arrays to compact {@link NodeId} hashes.
 *
 * Each path is serialized to a null-delimited string, hashed with SHA-256 (truncated to
 * {@link ID_BYTES} bytes), and stored in forward and inverted maps for O(1) lookup in
 * both directions.
 */
class HashRegistry {
  /**
   * Number of bytes taken from the SHA-256 digest to form a {@link NodeId}.
   */
  private static readonly ID_BYTES = 10;
  /**
   * Delimiter used when serializing a {@link NodePath} array to a string key.
   */
  private static readonly DELIMITER = "\0";
  /**
   * Forward map: serialized path string → hashed {@link NodeId}.
   */
  private readonly forward = new Map<NodePathString, NodeId>();
  /**
   * Inverted map: hashed {@link NodeId} → serialized path string.
   */
  private readonly inverted = new Map<NodeId, NodePathString>();

  /**
   * Returns the {@link NodeId} for the given path, registering it if not yet known.
   * @param nodePath The node's scope-chain path segments.
   * @returns The stable {@link NodeId} assigned to this path.
   * @throws If a SHA-256 hash collision is detected between two distinct paths.
   */
  encode(nodePath: NodePath): NodeId {
    const path = this._pathToString(nodePath);
    const existing = this.forward.get(path);
    if (existing) return existing;

    const id = this._hash(path);
    if (this.inverted.has(id)) {
      throw new GraphError(
        "GRAPH_DUPLICATE_HASH",
        `SHA-256 hash collision: "${path}" and "${this.inverted.get(id)}" produced the same ${HashRegistry.ID_BYTES}-byte digest "${id}". These are distinct paths that cannot coexist in the same registry.`,
      );
    }

    this.forward.set(path, id);
    this.inverted.set(id, path);
    return id;
  }

  /**
   * Reconstructs the {@link NodePath} for a previously registered {@link NodeId}.
   * @param id A {@link NodeId} returned by {@link encode}.
   * @returns The original path segments.
   * @throws If the ID was never registered in this registry.
   */
  decode(id: NodeId): NodePath {
    const path = this.inverted.get(id);
    if (!path)
      throw new GraphError(
        "GRAPH_UNREGISTERED_NODE",
        `NodeId "${id}" is not registered in this registry. Ensure the node was added via encode() before calling decode().`,
      );
    return this._stringToPath(path);
  }

  /**
   * Returns whether the given path has been registered.
   * @param path {@link NodePath} to look up.
   */
  has(path: NodePath): boolean;
  /**
   * Returns whether the given ID has been registered.
   * @param id {@link NodeId} to look up.
   */
  has(id: NodeId): boolean;

  has(target: NodePath | NodeId): boolean {
    if (Array.isArray(target)) {
      const key = this._pathToString(target);
      return this.forward.has(key);
    }

    return this.inverted.has(target);
  }

  /**
   * Produces a truncated base64url SHA-256 hash of the given path string.
   * @param path Serialized {@link NodePathString} to hash.
   * @returns A {@link NodeId} of length {@link ID_BYTES} bytes encoded as base64url.
   */
  private _hash(path: NodePathString): NodeId {
    return createHash("sha256")
      .update(path)
      .digest()
      .subarray(0, HashRegistry.ID_BYTES)
      .toString("base64url") as NodeId;
  }

  /**
   * Joins path segments into a single {@link NodePathString} using the null delimiter.
   * @param path Path segments to serialize.
   */
  private _pathToString(path: NodePath): NodePathString {
    return path.join(HashRegistry.DELIMITER) as NodePathString;
  }

  /**
   * Splits a {@link NodePathString} back into its original path segments.
   * @param string Serialized path string to deserialize.
   */
  private _stringToPath(string: NodePathString): NodePath {
    return string.split(HashRegistry.DELIMITER) as NodePath;
  }
}

export default HashRegistry;
