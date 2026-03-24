import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QueryMap } from "@/utils/query";

import CoreError from "./error";
import Plugin from "./plugin";

// ---------------------------------------------------------------------------
// Mock tree-sitter so no native binaries are required
// ---------------------------------------------------------------------------

const mockParse = vi.fn(() => ({ rootNode: { type: "program" } }));
const mockSetLanguage = vi.fn();

vi.mock("tree-sitter", () => ({
  default: vi.fn(function () {
    let _lang: unknown;
    return {
      parse: mockParse,
      setLanguage: (l: unknown) => {
        mockSetLanguage(l);
        _lang = l;
      },
      getLanguage: () => _lang,
    };
  }),
}));

// ---------------------------------------------------------------------------
// CJS require() interception for LanguagePlugin.load() validation tests
// ---------------------------------------------------------------------------

const CjsModule = require("node:module") as {
  _load: (...args: unknown[]) => unknown;
};
const originalLoad = CjsModule._load.bind(CjsModule);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_PLUGIN = "@symbex/javascript";

const validLangShape = {
  name: "typescript",
  language: 0,
  nodeTypeInfo: [],
} as unknown as import("tree-sitter").Language;

function fakeQueryMap(): QueryMap<string> {
  return new QueryMap<string>(validLangShape);
}

function fakeDescriptor() {
  return {
    language: validLangShape,
    query: fakeQueryMap(),
    captureConfig: {},
    convertConfig: {},
    references: vi.fn(),
  };
}

/** Installs a Module._load spy that returns `fake` for VALID_PLUGIN. */
function spyLoad(fake: unknown) {
  CjsModule._load = (request: unknown, ...args: unknown[]) =>
    request === VALID_PLUGIN ? fake : originalLoad(request, ...args);
}

// ---------------------------------------------------------------------------
// LanguagePlugin.load()
// ---------------------------------------------------------------------------

describe("LanguagePlugin.load()", () => {
  afterEach(() => {
    CjsModule._load = originalLoad;
  });

  describe("when the module has an invalid structure", () => {
    it("throws when the module default is null", () => {
      spyLoad({ default: null });

      try {
        Plugin.load(VALID_PLUGIN);
        expect.unreachable("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(CoreError);
        expect((e as CoreError).code).toBe("CORE_PLUGIN_LOAD_FAILED");
        expect((e as CoreError).message).toContain("is not an object");
      }
    });

    it("throws when the module default is not an object", () => {
      spyLoad({ default: 42 });

      try {
        Plugin.load(VALID_PLUGIN);
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as CoreError).code).toBe("CORE_PLUGIN_LOAD_FAILED");
        expect((e as CoreError).message).toContain("is not an object");
      }
    });

    it("throws when 'language' is missing", () => {
      spyLoad({
        default: {
          query: fakeQueryMap(),
          captureConfig: {},
          convertConfig: {},
        },
      });

      try {
        Plugin.load(VALID_PLUGIN);
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as CoreError).code).toBe("CORE_PLUGIN_LOAD_FAILED");
        expect((e as CoreError).message).toContain("language");
      }
    });

    it("throws when 'language' does not satisfy the Language shape", () => {
      spyLoad({
        default: {
          language: { notALanguage: true },
          query: fakeQueryMap(),
          captureConfig: {},
          convertConfig: {},
        },
      });

      try {
        Plugin.load(VALID_PLUGIN);
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as CoreError).code).toBe("CORE_PLUGIN_LOAD_FAILED");
        expect((e as CoreError).message).toContain("language");
      }
    });

    it("throws when 'query' is undefined", () => {
      spyLoad({
        default: {
          language: validLangShape,
          query: null,
          captureConfig: {},
          convertConfig: {},
        },
      });

      try {
        Plugin.load(VALID_PLUGIN);
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as CoreError).code).toBe("CORE_PLUGIN_LOAD_FAILED");
        expect((e as CoreError).message).toContain("query");
      }
    });

    it("throws when 'captureConfig' is null", () => {
      spyLoad({
        default: {
          language: validLangShape,
          query: fakeQueryMap(),
          captureConfig: null,
          convertConfig: {},
        },
      });

      try {
        Plugin.load(VALID_PLUGIN);
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as CoreError).code).toBe("CORE_PLUGIN_LOAD_FAILED");
        expect((e as CoreError).message).toContain("captureConfig");
      }
    });

    it("throws when 'convertConfig' is null", () => {
      spyLoad({
        default: {
          language: validLangShape,
          query: fakeQueryMap(),
          captureConfig: {},
          convertConfig: null,
        },
      });

      try {
        Plugin.load(VALID_PLUGIN);
        expect.unreachable("should have thrown");
      } catch (e) {
        expect((e as CoreError).code).toBe("CORE_PLUGIN_LOAD_FAILED");
        expect((e as CoreError).message).toContain("convertConfig");
      }
    });
  });

  describe("with a valid plugin", () => {
    it("returns a PluginDescriptor with the expected shape", () => {
      spyLoad({ default: fakeDescriptor() });

      const descriptor = Plugin.load(VALID_PLUGIN);

      expect(descriptor.query).toBeInstanceOf(QueryMap);
      expect(descriptor.captureConfig).toBeDefined();
      expect(descriptor.convertConfig).toBeDefined();
      expect(descriptor.language).toMatchObject({ name: expect.any(String) });
    });
  });
});

// ---------------------------------------------------------------------------
// LanguagePlugin (class)
// ---------------------------------------------------------------------------

describe("LanguagePlugin", () => {
  let plugin: Plugin;

  beforeEach(() => {
    vi.spyOn(Plugin, "load").mockReturnValue(fakeDescriptor());
    plugin = new Plugin(VALID_PLUGIN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockParse.mockReset();
    mockParse.mockReturnValue({ rootNode: { type: "program" } });
  });

  describe("language getter", () => {
    it("returns the language object from the loaded module", () => {
      expect(plugin.language).toMatchObject({ name: expect.any(String) });
    });
  });

  describe("parse()", () => {
    it("returns a tree for valid source", () => {
      const tree = plugin.parse("test.ts", "const x = 1;");
      expect(tree.rootNode.type).toBe("program");
    });

    it("wraps parser errors in CoreError with CORE_PLUGIN_PARSE_FAILED", () => {
      mockParse.mockImplementation(() => {
        throw new Error("internal parse error");
      });

      try {
        plugin.parse("bad.ts", "");
        expect.unreachable("should have thrown");
      } catch (e) {
        expect(e).toBeInstanceOf(CoreError);
        expect((e as CoreError).code).toBe("CORE_PLUGIN_PARSE_FAILED");
        expect((e as CoreError).message).toContain("bad.ts");
      }
    });
  });

  describe("extract()", () => {
    it("returns nodes and edges arrays for a parsed source", () => {
      const tree = plugin.parse("greet.ts", "export function greet() {}");
      const result = plugin.extract("greet.ts", tree.rootNode);

      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
    });
  });
});
