import type { Monaco } from "@monaco-editor/react";
import type { languages } from "monaco-editor";

/**
 * GDScript (Godot 4) Monaco language registration — a compact Monarch
 * tokenizer + editor configuration so `.gd` files get syntax highlighting in
 * the diff viewer / file editor instead of falling back to plain text.
 *
 * Registered once per Monaco instance; subsequent calls are no-ops.
 * The grammar covers the common Godot 4 surface: `#` comments, `@`-annotations,
 * keywords/type keywords, numbers (decimal/hex/binary with `_` separators),
 * quoted and triple-quoted strings.
 */

let gdscriptRegistered = false;

const GDSCRIPT_LANGUAGE: languages.IMonarchLanguage = {
  defaultToken: "",
  tokenPostfix: ".gd",
  keywords: [
    "and",
    "as",
    "assert",
    "await",
    "break",
    "breakpoint",
    "class",
    "class_name",
    "const",
    "continue",
    "elif",
    "else",
    "enum",
    "extends",
    "false",
    "for",
    "func",
    "if",
    "in",
    "is",
    "match",
    "not",
    "or",
    "pass",
    "return",
    "self",
    "signal",
    "static",
    "super",
    "true",
    "typeof",
    "unary",
    "void",
    "while",
    "yield",
  ],
  typeKeywords: [
    "bool",
    "int",
    "float",
    "String",
    "StringName",
    "NodePath",
    "Variant",
    "Object",
    "Vector2",
    "Vector2i",
    "Vector3",
    "Vector3i",
    "Vector4",
    "Vector4i",
    "Color",
    "Rect2",
    "Rect2i",
    "Transform2D",
    "Transform3D",
    "Basis",
    "Quaternion",
    "AABB",
    "Plane",
    "Node",
    "Node2D",
    "Node3D",
    "Control",
    "Resource",
    "Dictionary",
    "Array",
    "PackedByteArray",
    "PackedInt32Array",
    "PackedInt64Array",
    "PackedFloat32Array",
    "PackedFloat64Array",
    "PackedStringArray",
    "PackedVector2Array",
    "PackedVector3Array",
    "PackedColorArray",
    "Callable",
    "Signal",
    "RID",
  ],
  escapes:
    /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
  tokenizer: {
    root: [
      { include: "@whitespace" },
      // @-annotations (@export, @onready, @tool, @warning_ignore, …)
      [/@[A-Za-z_]\w*/, "annotation"],
      // Keywords / types / identifiers (order matters: types first so
      // `Vector2` etc. tokenize as type even though they start uppercase).
      [
        /[A-Za-z_]\w*/,
        {
          cases: {
            "@typeKeywords": "type",
            "@keywords": "keyword",
            "@default": "identifier",
          },
        },
      ],
      // Numbers: decimal (with underscores + optional exponent), hex, binary
      [/[0-9][0-9_]*(?:\.[0-9_]+)?(?:[eE][+-]?[0-9_]+)?/, "number"],
      [/0[xX][0-9a-fA-F_]+/, "number"],
      [/0[bB][01_]+/, "number"],
      // Triple-quoted strings must be matched before plain quotes
      [
        /"""/,
        { token: "string.quote", bracket: "@open", next: "@string_triple" },
      ],
      [
        /'''/,
        {
          token: "string.quote",
          bracket: "@open",
          next: "@string_triple_single",
        },
      ],
      [
        /"/,
        { token: "string.quote", bracket: "@open", next: "@string_double" },
      ],
      [
        /'/,
        { token: "string.quote", bracket: "@open", next: "@string_single" },
      ],
      [/[{}()[\]]/, "@brackets"],
      [/[=><!~?:&|+\-*/^%]+/, "operator"],
      [/[;,.`]/, "delimiter"],
    ],
    whitespace: [
      [/\s+/, "white"],
      [/#.*$/, "comment"],
    ],
    string_double: [
      [/[^"\\]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],
    string_single: [
      [/[^'\\]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/'/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],
    string_triple: [
      [/[^"\\]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/"""/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],
    string_triple_single: [
      [/[^'\\]+/, "string"],
      [/@escapes/, "string.escape"],
      [/\\./, "string.escape.invalid"],
      [/'''/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],
  },
};

const GDSCRIPT_CONFIGURATION: languages.LanguageConfiguration = {
  comments: { lineComment: "#" },
  brackets: [
    ["{", "}"],
    ["[", "]"],
    ["(", ")"],
  ],
  autoClosingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '"""', close: '"""' },
  ],
  surroundingPairs: [
    { open: "{", close: "}" },
    { open: "[", close: "]" },
    { open: "(", close: ")" },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
  folding: {
    markers: {
      start: new RegExp("^\\s*#region\\b"),
      end: new RegExp("^\\s*#endregion\\b"),
    },
  },
};

/** Register the `gdscript` Monaco language (idempotent). */
export function registerGdscriptLanguage(monaco: Monaco): void {
  if (gdscriptRegistered) return;
  gdscriptRegistered = true;
  monaco.languages.register({ id: "gdscript" });
  monaco.languages.setMonarchTokensProvider("gdscript", GDSCRIPT_LANGUAGE);
  monaco.languages.setLanguageConfiguration("gdscript", GDSCRIPT_CONFIGURATION);
}
