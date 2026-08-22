import {
  FileIcon as ReactFileIcon,
  defaultStyles,
  type FileIconProps,
  type IconType,
} from "react-file-icon";
import GenericFileIcon from "#/icons/file.svg?react";
import { cn } from "#/utils/utils";

/**
 * Supplementary extension styles for common extensions that react-file-icon's
 * built-in `defaultStyles` map doesn't cover (tsx, mdx, go, rs, yaml, sh, …).
 * Each entry uses the library's 17 glyph types with a recognizable
 * brand-ish label colour. Lookup order is EXTRA_STYLES first, then the
 * library's own map — see `getStyleForExtension`.
 */
const EXTRA_STYLES: Record<string, { labelColor: string; type: IconType }> = {
  tsx: { labelColor: "#3178C6", type: "code" },
  mdx: { labelColor: "#7C5CFF", type: "document" },
  go: { labelColor: "#00ADD8", type: "code" },
  rs: { labelColor: "#CE422B", type: "code" },
  toml: { labelColor: "#9C4221", type: "code" },
  yaml: { labelColor: "#CB171E", type: "document" },
  sh: { labelColor: "#4EAA25", type: "code" },
  bash: { labelColor: "#4EAA25", type: "code" },
  zsh: { labelColor: "#4EAA25", type: "code" },
  vue: { labelColor: "#41B883", type: "code" },
  svelte: { labelColor: "#FF3E00", type: "code" },
  sql: { labelColor: "#4F5D95", type: "code" },
  graphql: { labelColor: "#E10098", type: "code" },
  gql: { labelColor: "#E10098", type: "code" },
  gradle: { labelColor: "#126C74", type: "code" },
  kt: { labelColor: "#7F52FF", type: "code" },
  swift: { labelColor: "#F05138", type: "code" },
  dart: { labelColor: "#0175C2", type: "code" },
  lock: { labelColor: "#C9B974", type: "settings" },
  env: { labelColor: "#26A269", type: "settings" },
  gitignore: { labelColor: "#F05032", type: "settings" },
  npmrc: { labelColor: "#CB3837", type: "code" },
  dockerfile: { labelColor: "#2496ED", type: "code" },
  cjs: { labelColor: "#F7DF1E", type: "code" },
  mjs: { labelColor: "#F7DF1E", type: "code" },
  conf: { labelColor: "#A3B0C4", type: "settings" },
  cfg: { labelColor: "#A3B0C4", type: "settings" },
  ini: { labelColor: "#A3B0C4", type: "settings" },
};

/** Dotfile basenames → the EXTRA_STYLES key that should render their icon. */
const DOTFILE_STYLE_KEYS: Record<string, string> = {
  ".env": "env",
  ".npmrc": "npmrc",
  ".gitignore": "gitignore",
  ".dockerignore": "gitignore",
};

/**
 * Extract a lowercase extension from a path, or null when there is none
 * (no dot, or a dotfile like `.gitignore`). Well-known dotfiles resolve to
 * their style key so they get a real icon instead of the generic fallback;
 * `Dockerfile`/`Containerfile` (no extension at all) resolve to "dockerfile".
 */
function getFileExtension(path: string): string | null {
  const basename = path.split("/").pop() ?? path;
  const lower = basename.toLocaleLowerCase();

  if (lower === "dockerfile" || lower === "containerfile") {
    return "dockerfile";
  }
  if (lower.startsWith("dockerfile.")) {
    return "dockerfile";
  }

  if (lower in DOTFILE_STYLE_KEYS) {
    return DOTFILE_STYLE_KEYS[lower];
  }
  // .env.local / .env.production style multi-dot dotfiles.
  if (lower.startsWith(".env.")) {
    return "env";
  }

  const dotIndex = basename.lastIndexOf(".");
  if (dotIndex <= 0) return null; // no dot, or leading dot (dotfile)
  const extension = basename.slice(dotIndex + 1).toLocaleLowerCase();
  return extension.length > 0 ? extension : null;
}

/** Resolve a style for an extension: supplementary map first, library map second. */
function getStyleForExtension(
  extension: string,
): Partial<FileIconProps> | undefined {
  return (
    EXTRA_STYLES[extension] ??
    defaultStyles[extension as keyof typeof defaultStyles]
  );
}

interface FileTypeIconProps {
  path: string;
  className?: string;
}

/**
 * Per-extension file icon with a colour/glyph from react-file-icon's built-in
 * `defaultStyles` map plus the supplementary `EXTRA_STYLES` map above.
 * Unknown extensions (and files with no extension) fall back to the app's
 * generic file icon so the tree/search/tabs look stays consistent. Folders
 * are NOT handled here — callers keep FolderIcon.
 */
export function FileTypeIcon({ path, className }: FileTypeIconProps) {
  const extension = getFileExtension(path);
  const style = extension ? getStyleForExtension(extension) : undefined;

  if (!style) {
    return <GenericFileIcon className={cn("shrink-0", className)} />;
  }

  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      <ReactFileIcon extension={extension ?? undefined} {...style} />
    </span>
  );
}
