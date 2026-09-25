export type ColorThemeKey =
  | "openhands-deepsea"
  | "openhands-neutral"
  | "openhands-neo"
  | "openhands-light";

export interface ColorThemeDefinition {
  label: string;
  /** Overrides for --cool-grey-* CSS custom properties (our semantic scale) */
  scale: Record<string, string>;
  /**
   * Overrides for --heroui-* CSS custom properties.
   * HeroUI stores colors as space-separated HSL channels ("H S% L%") so Tailwind
   * utilities like bg-default-200 resolve to hsl(var(--heroui-default-200)).
   * These vars are set by the heroui() plugin on :root, [data-theme=dark] at
   * build time, so they must be overridden at the same or lower specificity
   * from a later stylesheet to pick up theme changes at runtime.
   */
  heroui: Record<string, string>;
  /** Overrides for --oh-* semantic tokens such as brand / button colors. */
  tokens?: Record<string, string>;
  /**
   * Native color-scheme for the page (drives form controls / scrollbars).
   * The inner AgentServerUIRoot wrapper keeps `data-theme="dark"` regardless
   * (heroui vars are overridden by the injected sheet either way), so this
   * only flips `color-scheme` and is otherwise cosmetic.
   */
  scheme?: "light" | "dark";
}

// HSL channel strings for the neutral grey palette (H=0, S=0%, L=hex/255*100)
// prettier-ignore
const NEUTRAL_HSL = {
  50:  "0 0% 96.86%", // #F7F7F7
  100: "0 0% 92.55%", // #ECECEC
  200: "0 0% 86.27%", // #DCDCDC
  300: "0 0% 74.51%", // #BEBEBE
  400: "0 0% 59.22%", // #979797
  500: "0 0% 45.1%",  // #737373
  600: "0 0% 33.73%", // #565656
  700: "0 0% 25.1%",  // #404040
  800: "0 0% 19.22%", // #313131
  850: "0 0% 15.69%", // #282828
  900: "0 0% 12.55%", // #202020
  950: "0 0% 9.41%",  // #181818
  975: "0 0% 6.27%",  // #101010
};

const NEUTRAL_SCALE = {
  "--cool-grey-50": "#F7F7F7",
  "--cool-grey-100": "#ECECEC",
  "--cool-grey-200": "#DCDCDC",
  "--cool-grey-300": "#BEBEBE",
  "--cool-grey-400": "#979797",
  "--cool-grey-500": "#737373",
  "--cool-grey-600": "#565656",
  "--cool-grey-700": "#404040",
  "--cool-grey-800": "#313131",
  "--cool-grey-900": "#282828",
  "--cool-grey-925": "#202020",
  "--cool-grey-950": "#181818",
  "--cool-grey-975": "#101010",
};

const NEUTRAL_HEROUI = {
  "--heroui-background": NEUTRAL_HSL[950],
  "--heroui-background-foreground": NEUTRAL_HSL[50],
  "--heroui-foreground-50": NEUTRAL_HSL[975],
  "--heroui-foreground-100": NEUTRAL_HSL[950],
  "--heroui-foreground-200": NEUTRAL_HSL[900],
  "--heroui-foreground-300": NEUTRAL_HSL[850],
  "--heroui-foreground-400": NEUTRAL_HSL[800],
  "--heroui-foreground-500": NEUTRAL_HSL[700],
  "--heroui-foreground-600": NEUTRAL_HSL[600],
  "--heroui-foreground-700": NEUTRAL_HSL[500],
  "--heroui-foreground-800": NEUTRAL_HSL[400],
  "--heroui-foreground-900": NEUTRAL_HSL[300],
  "--heroui-foreground": NEUTRAL_HSL[300],
  "--heroui-content1": NEUTRAL_HSL[900],
  "--heroui-content1-foreground": NEUTRAL_HSL[100],
  "--heroui-content2": NEUTRAL_HSL[850],
  "--heroui-content2-foreground": NEUTRAL_HSL[200],
  "--heroui-content3": NEUTRAL_HSL[800],
  "--heroui-content3-foreground": NEUTRAL_HSL[300],
  "--heroui-content4": NEUTRAL_HSL[700],
  "--heroui-content4-foreground": NEUTRAL_HSL[400],
  "--heroui-default-50": NEUTRAL_HSL[975],
  "--heroui-default-100": NEUTRAL_HSL[950],
  "--heroui-default-200": NEUTRAL_HSL[900],
  "--heroui-default-300": NEUTRAL_HSL[850],
  "--heroui-default-400": NEUTRAL_HSL[800],
  "--heroui-default-500": NEUTRAL_HSL[700],
  "--heroui-default-600": NEUTRAL_HSL[600],
  "--heroui-default-700": NEUTRAL_HSL[500],
  "--heroui-default-800": NEUTRAL_HSL[400],
  "--heroui-default-900": NEUTRAL_HSL[300],
  "--heroui-default-foreground": NEUTRAL_HSL[50],
  "--heroui-default": NEUTRAL_HSL[800],
};

// HSL channel strings for the light theme (same neutral grey palette, stops
// flipped so dark text lands on light surfaces).
// prettier-ignore
const LIGHT_HSL = {
  50:  "0 0% 6.27%",  // #101010 — darkest text
  100: "0 0% 6.27%",  // #101010
  200: "0 0% 9.41%",  // #181818
  300: "0 0% 12.55%", // #202020
  400: "0 0% 15.69%", // #282828
  500: "0 0% 19.22%", // #313131
  600: "0 0% 25.1%",  // #404040
  700: "0 0% 33.73%", // #565656
  800: "0 0% 45.1%",  // #737373
  850: "0 0% 59.22%", // #979797
  900: "0 0% 96.86%", // #F7F7F7 — raised surface
  925: "0 0% 98.04%", // #FAFAFA — surface
  950: "0 0% 100%",   // #FFFFFF — app shell base
  975: "0 0% 94.12%", // #F0F0F0 — deepest / inset surface
};

const LIGHT_SCALE = {
  "--cool-grey-50": "#101010",
  "--cool-grey-100": "#101010",
  "--cool-grey-200": "#181818",
  "--cool-grey-300": "#202020",
  "--cool-grey-400": "#282828",
  "--cool-grey-500": "#313131",
  "--cool-grey-600": "#404040",
  "--cool-grey-700": "#565656",
  "--cool-grey-800": "#737373",
  "--cool-grey-850": "#979797",
  "--cool-grey-900": "#F7F7F7",
  "--cool-grey-925": "#FAFAFA",
  "--cool-grey-950": "#FFFFFF",
  "--cool-grey-975": "#F0F0F0",
  // The --oh-* tokens below are set *inline* on the AgentServerUIRoot (inline
  // style beats any stylesheet), so they need !important to override the
  // flipped scale values with properly light-themed surfaces/borders.
  "--oh-focus": "#202020",
  "--oh-border": "#BFC6CF",
  "--oh-border-input": "#A9B1BB",
  "--oh-border-subtle": "#D7DCE2",
  "--oh-interactive-hover": "#D9DEE3",
  "--oh-interactive-active": "#C9D1D9",
  "--oh-interactive-selected": "#B6C2CF",
  "--oh-default": "#DCE0E5",
  "--oh-separator": "rgba(55, 65, 81, 0.18)",
  "--oh-scrollbar": "rgba(55, 65, 81, 0.3)",
  "--oh-scrollbar-hover": "rgba(55, 65, 81, 0.5)",
};

const LIGHT_HEROUI = {
  "--heroui-background": LIGHT_HSL[950],
  "--heroui-background-foreground": LIGHT_HSL[300],
  "--heroui-foreground-50": LIGHT_HSL[50],
  "--heroui-foreground-100": LIGHT_HSL[100],
  "--heroui-foreground-200": LIGHT_HSL[200],
  "--heroui-foreground-300": LIGHT_HSL[300],
  "--heroui-foreground-400": LIGHT_HSL[400],
  "--heroui-foreground-500": LIGHT_HSL[500],
  "--heroui-foreground-600": LIGHT_HSL[600],
  "--heroui-foreground-700": LIGHT_HSL[700],
  "--heroui-foreground-800": LIGHT_HSL[800],
  "--heroui-foreground-900": LIGHT_HSL[850],
  "--heroui-foreground": LIGHT_HSL[300],
  "--heroui-content1": LIGHT_HSL[950],
  "--heroui-content1-foreground": LIGHT_HSL[200],
  "--heroui-content2": LIGHT_HSL[900],
  "--heroui-content2-foreground": LIGHT_HSL[300],
  "--heroui-content3": "0 0% 92.55%",
  "--heroui-content3-foreground": LIGHT_HSL[400],
  "--heroui-content4": "0 0% 86.27%",
  "--heroui-content4-foreground": LIGHT_HSL[500],
  "--heroui-default-50": LIGHT_HSL[925],
  "--heroui-default-100": LIGHT_HSL[900],
  "--heroui-default-200": LIGHT_HSL[850],
  "--heroui-default-300": LIGHT_HSL[700],
  "--heroui-default-400": LIGHT_HSL[600],
  "--heroui-default-500": LIGHT_HSL[500],
  "--heroui-default-600": LIGHT_HSL[400],
  "--heroui-default-700": LIGHT_HSL[300],
  "--heroui-default-800": LIGHT_HSL[200],
  "--heroui-default-900": LIGHT_HSL[100],
  "--heroui-default-foreground": LIGHT_HSL[100],
  "--heroui-default": LIGHT_HSL[700],
};

import { AGENT_SERVER_UI_THEMEABLE_BRAND_VARIABLES } from "#/styles/agent-server-ui-style-scope";

/** CSS custom properties overridden by color themes (see applyColorTheme). */
export const COLOR_THEME_TOKEN_KEYS = AGENT_SERVER_UI_THEMEABLE_BRAND_VARIABLES;

/** White primary/accent tokens — used by OpenHands-Neo for button surfaces. */
const NEO_WHITE_BUTTON_TOKENS: Record<
  (typeof COLOR_THEME_TOKEN_KEYS)[number],
  string
> = {
  "--oh-color-primary": "#ffffff",
  "--oh-accent": "#ffffff",
  "--oh-warning": "#ffffff",
};

export const COLOR_THEMES: Record<ColorThemeKey, ColorThemeDefinition> = {
  "openhands-deepsea": {
    label: "OpenHands-DeepSea",
    // Matches the values already set by index.css; included so switching back
    // from another theme restores the original palette explicitly.
    scale: {
      "--cool-grey-50": "#F7F9FC",
      "--cool-grey-100": "#EEF2F7",
      "--cool-grey-200": "#DCE3EE",
      "--cool-grey-300": "#C3CDDC",
      "--cool-grey-400": "#A3B0C4",
      "--cool-grey-500": "#7E8A9E",
      "--cool-grey-600": "#626D82",
      "--cool-grey-700": "#4B5468",
      "--cool-grey-800": "#383F50",
      "--cool-grey-900": "#2C313F",
      "--cool-grey-925": "#21252F",
      "--cool-grey-950": "#0B0E14",
      "--cool-grey-975": "#05070A",
    },
    // Values generated by heroui() from hero.ts — restore them explicitly when
    // switching back from another theme.
    heroui: {
      "--heroui-background": "220 29.03% 6.08%",
      "--heroui-background-foreground": "216 45.45% 97.84%",
      "--heroui-foreground-50": "216 33.33% 2.94%",
      "--heroui-foreground-100": "220 29.03% 6.08%",
      "--heroui-foreground-200": "222.86 17.5% 15.69%",
      "--heroui-foreground-300": "224.21 17.76% 20.98%",
      "--heroui-foreground-400": "222.5 17.65% 26.67%",
      "--heroui-foreground-500": "221.38 16.2% 35.1%",
      "--heroui-foreground-600": "219.38 14.04% 44.71%",
      "--heroui-foreground-700": "217.5 14.16% 55.69%",
      "--heroui-foreground-800": "216.36 21.85% 70.39%",
      "--heroui-foreground-900": "216 26.32% 81.37%",
      "--heroui-foreground": "216 26.32% 81.37%",
      "--heroui-content1": "222.86 17.5% 15.69%",
      "--heroui-content1-foreground": "213.33 36% 95.1%",
      "--heroui-content2": "224.21 17.76% 20.98%",
      "--heroui-content2-foreground": "216.67 34.62% 89.8%",
      "--heroui-content3": "222.5 17.65% 26.67%",
      "--heroui-content3-foreground": "216 26.32% 81.37%",
      "--heroui-content4": "221.38 16.2% 35.1%",
      "--heroui-content4-foreground": "216.36 21.85% 70.39%",
      "--heroui-default-50": "216 33.33% 2.94%",
      "--heroui-default-100": "220 29.03% 6.08%",
      "--heroui-default-200": "222.86 17.5% 15.69%",
      "--heroui-default-300": "224.21 17.76% 20.98%",
      "--heroui-default-400": "222.5 17.65% 26.67%",
      "--heroui-default-500": "221.38 16.2% 35.1%",
      "--heroui-default-600": "219.38 14.04% 44.71%",
      "--heroui-default-700": "217.5 14.16% 55.69%",
      "--heroui-default-800": "216.36 21.85% 70.39%",
      "--heroui-default-900": "216 26.32% 81.37%",
      "--heroui-default-foreground": "216 45.45% 97.84%",
      "--heroui-default": "222.5 17.65% 26.67%",
    },
  },

  "openhands-neutral": {
    label: "OpenHands-Neutral",
    scale: NEUTRAL_SCALE,
    // Each stop follows the same positional mapping as hero.ts:
    //   heroui-default-100 ← cool-grey-950 position ← neutral-950 (#181818)
    //   heroui-default-200 ← cool-grey-925 position ← neutral-900 (#202020)
    //   ...etc.
    heroui: NEUTRAL_HEROUI,
  },

  "openhands-neo": {
    label: "OpenHands-Neo",
    scale: NEUTRAL_SCALE,
    heroui: NEUTRAL_HEROUI,
    tokens: NEO_WHITE_BUTTON_TOKENS,
  },

  "openhands-light": {
    label: "OpenHands-Light",
    // Flipped neutral scale: dark text on white/light-grey surfaces. The
    // interactive/border/focus tokens that don't survive a pure luminance
    // flip (borders would end up near-black) are overridden explicitly —
    // applyColorTheme emits those with !important because they're set inline
    // on the AgentServerUIRoot and would otherwise lose to the inline style.
    scale: LIGHT_SCALE,
    heroui: LIGHT_HEROUI,
    scheme: "light",
  },
};

/** Dark-natured themes offered in Settings → App → Dark theme. */
export const DARK_COLOR_THEME_KEYS: readonly ColorThemeKey[] = [
  "openhands-neutral",
  "openhands-deepsea",
  "openhands-neo",
];

/** Light-natured themes offered in Settings → App → Light theme. */
export const LIGHT_COLOR_THEME_KEYS: readonly ColorThemeKey[] = [
  "openhands-light",
];

/** Default selection for the Dark theme picker (also the app default). */
export const DEFAULT_DARK_COLOR_THEME: ColorThemeKey = "openhands-neutral";

/** Default selection for the Light theme picker. */
export const DEFAULT_LIGHT_COLOR_THEME: ColorThemeKey = "openhands-light";

export const DEFAULT_COLOR_THEME: ColorThemeKey = DEFAULT_DARK_COLOR_THEME;

export const AVAILABLE_COLOR_THEME_KEYS: readonly ColorThemeKey[] = [
  ...DARK_COLOR_THEME_KEYS,
  ...LIGHT_COLOR_THEME_KEYS,
];

/** Picker options for Settings → App → Dark theme. */
export const DARK_COLOR_THEMES = DARK_COLOR_THEME_KEYS.map((key) => ({
  key,
  label: COLOR_THEMES[key].label,
}));

/** Picker options for Settings → App → Light theme. */
export const LIGHT_COLOR_THEMES = LIGHT_COLOR_THEME_KEYS.map((key) => ({
  key,
  label: COLOR_THEMES[key].label,
}));

export const AVAILABLE_COLOR_THEMES = [
  ...DARK_COLOR_THEMES,
  ...LIGHT_COLOR_THEMES,
];

/** Whether a theme key is light-natured (drives the sidebar toggle + mode). */
export function isColorThemeLight(key: ColorThemeKey): boolean {
  return (LIGHT_COLOR_THEME_KEYS as readonly string[]).includes(key);
}

const STORAGE_KEY = "openhands-color-theme";
const LIGHT_THEME_STORAGE_KEY = "openhands-light-theme";
const DARK_THEME_STORAGE_KEY = "openhands-dark-theme";

/** Read the persisted theme key from localStorage, falling back to the default. */
export function readPersistedColorTheme(): ColorThemeKey {
  if (typeof window === "undefined") return DEFAULT_COLOR_THEME;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored in COLOR_THEMES) return stored as ColorThemeKey;
  } catch {
    // ignore quota / privacy-mode failures
  }
  return DEFAULT_COLOR_THEME;
}

/** Read the persisted Light-theme picker selection, falling back to the default. */
export function readPersistedLightThemeKey(): ColorThemeKey {
  if (typeof window === "undefined") return DEFAULT_LIGHT_COLOR_THEME;
  try {
    const stored = window.localStorage.getItem(LIGHT_THEME_STORAGE_KEY);
    if (
      stored &&
      (LIGHT_COLOR_THEME_KEYS as readonly string[]).includes(stored)
    ) {
      return stored as ColorThemeKey;
    }
  } catch {
    // ignore quota / privacy-mode failures
  }
  return DEFAULT_LIGHT_COLOR_THEME;
}

/** Persist the Light-theme picker selection to localStorage. */
export function persistLightThemeKey(key: ColorThemeKey): void {
  try {
    window.localStorage.setItem(LIGHT_THEME_STORAGE_KEY, key);
  } catch {
    // ignore
  }
}

/** Read the persisted Dark-theme picker selection, falling back to the default. */
export function readPersistedDarkThemeKey(): ColorThemeKey {
  if (typeof window === "undefined") return DEFAULT_DARK_COLOR_THEME;
  try {
    const stored = window.localStorage.getItem(DARK_THEME_STORAGE_KEY);
    if (
      stored &&
      (DARK_COLOR_THEME_KEYS as readonly string[]).includes(stored)
    ) {
      return stored as ColorThemeKey;
    }
  } catch {
    // ignore quota / privacy-mode failures
  }
  return DEFAULT_DARK_COLOR_THEME;
}

/** Persist the Dark-theme picker selection to localStorage. */
export function persistDarkThemeKey(key: ColorThemeKey): void {
  try {
    window.localStorage.setItem(DARK_THEME_STORAGE_KEY, key);
  } catch {
    // ignore
  }
}

/** Persist the theme key to localStorage. */
export function persistColorTheme(key: ColorThemeKey): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // ignore
  }
}

const THEME_STYLE_TAG_ID = "oh-color-theme-override";

/**
 * Apply a theme by injecting (or replacing) a <style> tag that overrides
 * both our custom --cool-grey-* primitives and HeroUI's --heroui-* tokens.
 *
 * Why a <style> tag:
 *   PostCSS transforms :root / body to [data-agent-server-ui], so --cool-grey-*
 *   is set on EVERY element carrying that attribute. A body inline-style only
 *   overrides body itself — inner matching elements keep the stylesheet value.
 *
 * Why heroui variables:
 *   HeroUI stores colors as HSL channels in --heroui-* vars on [data-theme=dark].
 *   They reference their own token system and are unaffected by --cool-grey-*
 *   changes, so we override them from the same injected sheet.
 *
 * Why doubled selectors + re-append on every call:
 *   "Later sheet wins the tie" cannot be relied on: in the built SPA
 *   (ssr:false, prerendered shell) React 19 re-creates the <head> elements it
 *   manages (<Meta/>/<Links/>) whenever the tree above the router remounts.
 *   That can re-insert the base stylesheet <link> AFTER this tag, allowing its
 *   unlayered [data-agent-server-ui] variable rules (0,1,0) to win every tie.
 *   Doubling the attribute selectors ([x][x], 0,2,0) beats them from any
 *   position in <head>; re-appending on each apply keeps document order
 *   favorable as well.
 */
export function applyColorTheme(key: ColorThemeKey): void {
  if (typeof document === "undefined") return;
  const { scale, heroui, tokens = {}, scheme } = COLOR_THEMES[key];

  // --oh-* entries in a theme's scale override tokens that are set *inline*
  // on the AgentServerUIRoot (inline styles beat stylesheets), so they must
  // be emitted with !important to win. --cool-grey-* entries resolve through
  // the vars and need no !important.
  const scaleDecls = Object.entries(scale)
    .map(([p, v]) => {
      const important = p.startsWith("--oh-") ? " !important" : "";
      return `  ${p}: ${v}${important};`;
    })
    .join("\n");

  const herouiDecls = Object.entries(heroui)
    .map(([p, v]) => `  ${p}: ${v};`)
    .join("\n");

  const tokenDecls = Object.entries(tokens)
    .map(([p, v]) => `  ${p}: ${v};`)
    .join("\n");

  // Target both selectors for heroui vars:
  //   [data-agent-server-ui] — covers document.body (portal destination) so
  //     portalled popover/listbox content inherits the overridden values.
  //   [data-theme=dark]      — covers the inner AgentServerUIRoot wrapper so
  //     components scoped inside the dark theme wrapper also pick them up.
  // Both are doubled to out-specify the base sheet regardless of stylesheet
  // order (see the doc comment above).
  const css = [
    `[data-agent-server-ui][data-agent-server-ui] {\n${scaleDecls}\n${herouiDecls}\n${tokenDecls}\n}`,
    `[data-theme=dark][data-theme=dark] {\n${herouiDecls}\n}`,
  ].join("\n");

  let styleEl = document.getElementById(
    THEME_STYLE_TAG_ID,
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = THEME_STYLE_TAG_ID;
  }
  styleEl.textContent = css;
  // Re-append even when the tag already exists (appendChild relocates a
  // connected node) so the override also stays after any re-inserted <link>.
  document.head.appendChild(styleEl);

  // Flip native color-scheme so form controls / scrollbars match the theme.
  document.documentElement.style.colorScheme =
    scheme === "light" ? "light" : "dark";

  syncColorThemeTokensOnScopeRoots(tokens);
}

function syncColorThemeTokensOnScopeRoots(
  tokens: Record<string, string>,
): void {
  const roots = document.querySelectorAll("[data-agent-server-ui]");
  for (const root of roots) {
    if (!(root instanceof HTMLElement)) continue;

    for (const key of COLOR_THEME_TOKEN_KEYS) {
      const value = tokens[key];
      if (value) {
        root.style.setProperty(key, value);
      } else {
        root.style.removeProperty(key);
      }
    }
  }
}
