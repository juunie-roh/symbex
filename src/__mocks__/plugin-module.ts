import type Parser from "tree-sitter";
import { vi } from "vitest";

import type { Plugin } from "@/core";

const mockPlugin = vi.mockObject({
  language: vi.mockObject({} as Parser.Language),
} as unknown as Plugin.Descriptor);

const mockPlugin_no_language = vi.mockObject({});
