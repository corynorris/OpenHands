/**
 * Workspace-ignore pattern matching.
 *
 * Patterns are intentionally simple (no new deps):
 *  - A plain name (e.g. `.godot`) matches a file OR folder with that name at
 *    any depth of the tree.
 *  - A glob on the basename (e.g. `*.generated.cs`, `test?.ts`) matches any
 *    file whose basename fits the glob, at any depth.
 *
 * Directory-name patterns (no glob chars, no slashes) can additionally be
 * injected into the local backend's `find -prune` expression so huge ignored
 * folders are never even walked; everything else is filtered client-side.
 */

const SAFE_FIND_PATTERN = /^[\w.\-*?/]+$/;

function isGlobPattern(pattern: string): boolean {
  return pattern.includes("*") || pattern.includes("?");
}

function escapeRegexCharacter(character: string): string {
  return character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Convert a basename glob (`*.generated.cs`) to a full-match regex. */
function globToRegex(glob: string): string {
  let out = "";
  for (const character of glob) {
    if (character === "*") out += "[^/]*";
    else if (character === "?") out += "[^/]";
    else out += escapeRegexCharacter(character);
  }
  return out;
}

/** Does a single pattern ignore the given path? */
export function patternMatchesPath(pattern: string, path: string): boolean {
  const trimmed = pattern.trim();
  if (!trimmed) return false;

  if (isGlobPattern(trimmed)) {
    const matcher = new RegExp(`^${globToRegex(trimmed.toLocaleLowerCase())}$`);
    const basename = path.split("/").pop() ?? path;
    return matcher.test(basename.toLocaleLowerCase());
  }

  // Plain name: match any path segment (folder or file) at any depth.
  return path
    .split("/")
    .some(
      (segment) => segment.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    );
}

/** Filter a path list down to the ones no pattern ignores. */
export function filterIgnoredPaths(
  paths: string[],
  patterns: string[],
): string[] {
  const active = patterns.map((pattern) => pattern.trim()).filter(Boolean);
  if (active.length === 0) return paths;
  return paths.filter(
    (path) => !active.some((pattern) => patternMatchesPath(pattern, path)),
  );
}

/**
 * Directory-name patterns safe to inject into the `find -prune` expression:
 * no glob chars (those only match basenames client-side), no slashes, and
 * shell-safe characters only — patterns are user-supplied and end up inside
 * a bash command string.
 */
export function getFindPrunePatterns(patterns: string[]): string[] {
  return patterns
    .map((pattern) => pattern.trim())
    .filter(
      (pattern) =>
        pattern.length > 0 &&
        !isGlobPattern(pattern) &&
        !pattern.includes("/") &&
        SAFE_FIND_PATTERN.test(pattern),
    );
}
