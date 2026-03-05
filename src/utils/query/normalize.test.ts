import { describe, expect, it } from "vitest";

import { normalize } from "./normalize";

describe("normalize", () => {
  it("strips single-line comments", () => {
    expect(normalize("; this is a comment\n(identifier)")).toBe("(identifier)");
  });

  it("strips double-semicolon comments", () => {
    expect(normalize(";; this is a comment\n(identifier)")).toBe(
      "(identifier)",
    );
  });

  it("strips inline comments", () => {
    expect(normalize("(identifier) ; inline comment")).toBe("(identifier)");
  });

  it("collapses whitespace to single spaces", () => {
    expect(normalize("(call_expression\n  function: (identifier))")).toBe(
      "(call_expression function: (identifier))",
    );
  });

  it("handles empty input", () => {
    expect(normalize("")).toBe("");
  });

  it("handles only comments", () => {
    expect(normalize("; comment\n;; another")).toBe("");
  });
});
