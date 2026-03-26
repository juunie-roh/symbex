import { afterEach, describe, expect, it, vi } from "vitest";

import scmPlugin from "./scm-plugin";

vi.mock("fs");

describe("scmPlugin", () => {
  afterEach(() => vi.restoreAllMocks());

  it("has correct plugin name", () => {
    expect(scmPlugin.name).toBe("symbex-scm");
  });

  it("registers onLoad for .scm files", () => {
    const onLoad = vi.fn();
    scmPlugin.setup({ onLoad } as any);
    expect(onLoad).toHaveBeenCalledWith(
      { filter: /\.scm$/ },
      expect.any(Function),
    );
  });

  it("reads the file and returns normalized content as a JS default export", async () => {
    const fs = await import("fs");
    vi.mocked(fs.readFileSync).mockReturnValue(
      "; comment\n(identifier) @name" as any,
    );

    const onLoad = vi.fn();
    scmPlugin.setup({ onLoad } as any);
    const handler = onLoad.mock.calls[0][1];

    const result = handler({ path: "/fake/query.scm" });

    expect(fs.readFileSync).toHaveBeenCalledWith("/fake/query.scm", "utf8");
    expect(result).toEqual({
      contents: `export default ${JSON.stringify("(identifier) @name")}`,
      loader: "js",
    });
  });

  it("strips all comments and collapses whitespace", async () => {
    const fs = await import("fs");
    vi.mocked(fs.readFileSync).mockReturnValue(
      "; top comment\n(call_expression\n  function: (identifier)) ;; inline" as any,
    );

    const onLoad = vi.fn();
    scmPlugin.setup({ onLoad } as any);
    const handler = onLoad.mock.calls[0][1];

    const result = handler({ path: "/fake/query.scm" });

    expect(result.contents).toBe(
      `export default ${JSON.stringify("(call_expression function: (identifier))")}`,
    );
  });
});
