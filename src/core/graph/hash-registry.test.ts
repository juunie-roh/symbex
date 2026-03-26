import { createHash } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NodeId, NodePath } from "@/models";

import HashRegistry from "./hash-registry";

const store = vi.hoisted(() => ({
  realCreateHash: undefined as typeof createHash | undefined,
}));

vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  store.realCreateHash = actual.createHash;
  return { ...actual, createHash: vi.fn(actual.createHash) };
});

describe("HashRegistry", () => {
  let registry: HashRegistry;

  const path = (segments: string[]) => segments as NodePath;

  beforeEach(() => {
    registry = new HashRegistry();
  });

  afterEach(() => {
    vi.mocked(createHash).mockReset();
    vi.mocked(createHash).mockImplementation(store.realCreateHash!);
  });

  describe("encode", () => {
    it("returns a non-empty string id", () => {
      const id = registry.encode(path(["src/foo.ts"]));
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("returns the same id for the same path", () => {
      const a = registry.encode(path(["src/foo.ts", "Foo"]));
      const b = registry.encode(path(["src/foo.ts", "Foo"]));
      expect(a).toBe(b);
    });

    it("returns different ids for different paths", () => {
      const a = registry.encode(path(["src/foo.ts", "Foo"]));
      const b = registry.encode(path(["src/foo.ts", "Bar"]));
      expect(a).not.toBe(b);
    });

    it("handles a single-segment path", () => {
      expect(() => registry.encode(path(["src/foo.ts"]))).not.toThrow();
    });

    it("handles a deeply nested path", () => {
      expect(() =>
        registry.encode(path(["src/foo.ts", "Foo", "bar", "baz"])),
      ).not.toThrow();
    });

    it("throws on hash collision between two distinct paths", () => {
      const fixedDigest = Buffer.alloc(32, 0xab);
      vi.mocked(createHash).mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue(fixedDigest),
      } as any);

      registry.encode(path(["src/foo.ts"]));
      expect(() => registry.encode(path(["src/bar.ts"]))).toThrow(
        /SHA-256 hash collision/,
      );
    });
  });

  describe("decode", () => {
    it("round-trips a path through encode then decode", () => {
      const segments = ["src/foo.ts", "Foo", "method"];
      const id = registry.encode(path(segments));
      expect(registry.decode(id)).toEqual(segments);
    });

    it("throws for an unknown id", () => {
      expect(() => registry.decode("unknown" as NodeId)).toThrow(
        /not registered in this registry/,
      );
    });
  });

  describe("has", () => {
    it("returns false for an unregistered path", () => {
      expect(registry.has(path(["src/foo.ts"]))).toBe(false);
    });

    it("returns true for a registered path", () => {
      const p = path(["src/foo.ts", "Foo"]);
      registry.encode(p);
      expect(registry.has(p)).toBe(true);
    });

    it("returns false for an unregistered id", () => {
      expect(registry.has("unknown" as NodeId)).toBe(false);
    });

    it("returns true for a registered id", () => {
      const id = registry.encode(path(["src/foo.ts"]));
      expect(registry.has(id)).toBe(true);
    });
  });
});
