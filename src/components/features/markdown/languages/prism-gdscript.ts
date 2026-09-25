/**
 * Minimal GDScript (Godot 4) grammar for PrismLight, shaped like the
 * react-syntax-highlighter language modules: a function that installs
 * `Prism.languages.gdscript` when called. Prism core ships no GDScript
 * grammar, so this is hand-rolled for the common Godot 4 surface:
 * `#` comments, quoted/triple-quoted strings, keywords, `@`-annotations,
 * built-in types, numbers (decimal/hex/binary with `_` separators) and
 * operators.
 */

type PrismLike = { languages: Record<string, unknown> };

const GDSCRIPT_KEYWORDS =
  "\\b(?:and|as|assert|await|break|breakpoint|class|class_name|const|continue|elif|else|enum|extends|false|for|func|if|in|is|match|not|or|pass|return|self|signal|static|super|true|typeof|unary|void|while|yield)\\b";

const GDSCRIPT_BUILTIN_TYPES =
  "\\b(?:bool|int|float|String|StringName|NodePath|Variant|Object|Vector2|Vector2i|Vector3|Vector3i|Vector4|Vector4i|Color|Rect2|Rect2i|Transform2D|Transform3D|Basis|Quaternion|AABB|Plane|Node|Node2D|Node3D|Control|Resource|Dictionary|Array|PackedByteArray|PackedInt32Array|PackedInt64Array|PackedFloat32Array|PackedFloat64Array|PackedStringArray|PackedVector2Array|PackedVector3Array|PackedColorArray|Callable|Signal|RID)\\b";

export default function gdscript(Prism: PrismLike): void {
  // eslint-disable-next-line no-param-reassign -- language modules install onto the Prism object by design
  Prism.languages.gdscript = {
    comment: /#.*/,
    string: {
      pattern:
        /(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/,
      greedy: true,
    },
    annotation: /@[A-Za-z_]\w*/,
    keyword: new RegExp(GDSCRIPT_KEYWORDS),
    builtin: new RegExp(GDSCRIPT_BUILTIN_TYPES),
    number:
      /\b(?:\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d[\d_]*)?|0[xX][0-9a-fA-F_]+|0[bB][01_]+)\b/,
    operator: /[=><!~?:&|+\-*/^%]+/,
    punctuation: /[{}()[\].,;]/,
  };
}

// refractor.register requires the language module to be a function carrying
// a `displayName` (it ignores the name argument passed to registerLanguage).
(gdscript as unknown as { displayName: string }).displayName = "gdscript";
