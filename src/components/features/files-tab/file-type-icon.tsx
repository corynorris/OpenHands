import { FileIcon as ReactFileIcon, defaultStyles } from "react-file-icon";
import GenericFileIcon from "#/icons/file.svg?react";
import { cn } from "#/utils/utils";

/**
 * Extract a lowercase extension from a path, or null when there is none
 * (no dot, or a dotfile like `.gitignore` where the "extension" is the
 * whole basename — those render as the generic file icon).
 */
function getFileExtension(path: string): string | null {
  const basename = path.split("/").pop() ?? path;
  const dotIndex = basename.lastIndexOf(".");
  if (dotIndex <= 0) return null; // no dot, or leading dot (dotfile)
  const extension = basename.slice(dotIndex + 1).toLocaleLowerCase();
  return extension.length > 0 ? extension : null;
}

interface FileTypeIconProps {
  path: string;
  className?: string;
}

/**
 * Per-extension file icon with a colour/glyph from react-file-icon's built-in
 * `defaultStyles` map. Unknown extensions (and files with no extension) fall
 * back to the app's generic file icon so the tree/search/tabs look stays
 * consistent. Folders are NOT handled here — callers keep FolderIcon.
 */
export function FileTypeIcon({ path, className }: FileTypeIconProps) {
  const extension = getFileExtension(path);
  const style = extension
    ? defaultStyles[extension as keyof typeof defaultStyles]
    : undefined;

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
