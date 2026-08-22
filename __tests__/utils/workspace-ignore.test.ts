import { describe, expect, it } from "vitest";
import {
  filterIgnoredPaths,
  getFindPrunePatterns,
  patternMatchesPath,
} from "#/utils/workspace-ignore";

describe("patternMatchesPath", () => {
  it("matches a plain folder name at any depth", () => {
    expect(patternMatchesPath(".godot", "addons/.godot/ui_layout.cpp")).toBe(
      true,
    );
    expect(
      patternMatchesPath(".godot", ".godot/editor/editor_layout.cfg"),
    ).toBe(true);
    expect(patternMatchesPath("generated", "src/generated/code.ts")).toBe(true);
    expect(patternMatchesPath("generated", "src/lib/code.ts")).toBe(false);
  });

  it("matches a plain file name at any depth", () => {
    expect(patternMatchesPath(".env", "config/.env")).toBe(true);
    expect(patternMatchesPath(".env", "config/.env.example")).toBe(false);
  });

  it("matches basename globs at any depth", () => {
    expect(
      patternMatchesPath("*.generated.cs", "src/Widget.generated.cs"),
    ).toBe(true);
    expect(patternMatchesPath("*.generated.cs", "src/Widget.cs")).toBe(false);
    expect(patternMatchesPath("test?.ts", "src/test1.ts")).toBe(true);
    expect(patternMatchesPath("test?.ts", "src/test12.ts")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(patternMatchesPath("Godot", "x/Godot/y")).toBe(true);
    expect(patternMatchesPath("GODOT", "x/godot/y")).toBe(true);
    // A pattern without the leading dot is a different name.
    expect(patternMatchesPath("GODOT", "x/.godot/y")).toBe(false);
    expect(patternMatchesPath("*.CS", "a/b.cs")).toBe(true);
  });

  it("ignores empty / whitespace-only patterns", () => {
    expect(patternMatchesPath("", "a/b")).toBe(false);
    expect(patternMatchesPath("   ", "a/b")).toBe(false);
  });
});

describe("filterIgnoredPaths", () => {
  it("returns paths unchanged when there are no patterns", () => {
    const paths = ["a", "b/c"];
    expect(filterIgnoredPaths(paths, [])).toEqual(paths);
  });

  it("drops dir-name and glob-matched paths", () => {
    const paths = [
      "src/a.ts",
      ".godot/x",
      "src/Widget.generated.cs",
      "src/generated/y.cs",
      "src/main.go",
    ];
    // ".godot" drops the .godot tree; "*.generated.cs" drops files whose
    // BASENAME matches the glob (not the folder named "generated" — that
    // would need a plain "generated" pattern).
    expect(filterIgnoredPaths(paths, [".godot", "*.generated.cs"])).toEqual([
      "src/a.ts",
      "src/generated/y.cs",
      "src/main.go",
    ]);
  });
});

describe("getFindPrunePatterns", () => {
  it("only returns shell-safe plain directory names", () => {
    expect(
      getFindPrunePatterns([
        ".godot",
        "*.generated.cs",
        "a/b",
        "rm -rf /",
        "x;y",
        "generated",
      ]),
    ).toEqual([".godot", "generated"]);
  });
});
