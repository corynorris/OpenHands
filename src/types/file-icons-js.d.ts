declare module "file-icons-js" {
  /**
   * CSS class for the Atom file-icon matching `name` (e.g. "js-icon"), or
   * null when nothing matches. Pair with the base "icon" class:
   * `<i className={cn("icon", glyph)} />`.
   */
  export function getClass(name: string): string | null;

  /**
   * Like getClass, but appends the set's native colour class when the icon
   * has one (e.g. "js-icon medium-yellow"); returns the bare icon class when
   * the icon has no colour variant.
   */
  export function getClassWithColor(name: string): string | null;
}
