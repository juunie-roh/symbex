import type TSParser from "tree-sitter";
import { vi } from "vitest";

import { Language } from "@/core/language";

const queryString = "";

const mockPlugin = vi.mockObject({
  language: vi.mockObject({} as TSParser.Language),
  capture: vi.fn(),
  convert: vi.fn(),
  queryString,
} satisfies Language.Module);

const mockPlugin_no_language = vi.mockObject({
  capture: vi.fn(),
  convert: vi.fn(),
  queryString,
});

const mockPlugin_no_capture = vi.mockObject({
  language: vi.mockObject({} as TSParser.Language),
  convert: vi.fn(),
  queryString,
});

const mockPlugin_no_convert = vi.mockObject({
  language: vi.mockObject({} as TSParser.Language),
  capture: vi.fn(),
  queryString,
});

const mockPlugin_no_queryString = vi.mockObject({
  language: vi.mockObject({} as TSParser.Language),
  capture: vi.fn(),
  convert: vi.fn(),
});

const mockPlugin_invalid_queryString = vi.mockObject({
  language: vi.mockObject({} as TSParser.Language),
  capture: vi.fn(),
  convert: vi.fn(),
  queryString: 3,
});
