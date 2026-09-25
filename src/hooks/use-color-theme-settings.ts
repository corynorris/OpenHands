import { create } from "zustand";
import { useColorTheme } from "#/hooks/use-color-theme";
import {
  COLOR_THEMES,
  getActiveColorTheme,
  setColorTheme,
  type ColorThemeKey,
} from "#/themes/color-themes";

const LIGHT_THEME_STORAGE_KEY = "openhands-light-theme";
const DARK_THEME_STORAGE_KEY = "openhands-dark-theme";

const ALL_THEME_KEYS = Object.keys(COLOR_THEMES) as ColorThemeKey[];

/** Every light-natured theme offered in Settings → App → Light theme. */
export const LIGHT_COLOR_THEME_KEYS = ALL_THEME_KEYS.filter(
  (key) => COLOR_THEMES[key].appearance === "light",
);

/** Every dark-natured theme offered in Settings → App → Dark theme. */
export const DARK_COLOR_THEME_KEYS = ALL_THEME_KEYS.filter(
  (key) => COLOR_THEMES[key].appearance === "dark",
);

export const LIGHT_COLOR_THEMES = LIGHT_COLOR_THEME_KEYS.map((key) => ({
  key,
  label: COLOR_THEMES[key].label,
}));

export const DARK_COLOR_THEMES = DARK_COLOR_THEME_KEYS.map((key) => ({
  key,
  label: COLOR_THEMES[key].label,
}));

const DEFAULT_LIGHT_COLOR_THEME: ColorThemeKey =
  LIGHT_COLOR_THEME_KEYS.includes("openhands-light")
    ? "openhands-light"
    : LIGHT_COLOR_THEME_KEYS[0];

const DEFAULT_DARK_COLOR_THEME: ColorThemeKey = DARK_COLOR_THEME_KEYS.includes(
  "openhands-neutral",
)
  ? "openhands-neutral"
  : DARK_COLOR_THEME_KEYS[0];

function readStoredThemeKey(
  storageKey: string,
  allowed: readonly ColorThemeKey[],
  fallback: ColorThemeKey,
): ColorThemeKey {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && (allowed as readonly string[]).includes(stored)) {
      return stored as ColorThemeKey;
    }
  } catch {
    // ignore quota / privacy-mode failures
  }
  return fallback;
}

function persistThemeKey(storageKey: string, key: ColorThemeKey): void {
  try {
    window.localStorage.setItem(storageKey, key);
  } catch {
    // ignore
  }
}

interface ColorThemeSettingsState {
  /** The theme selected for light mode in Settings → App → Light theme. */
  lightKey: ColorThemeKey;
  /** The theme selected for dark mode in Settings → App → Dark theme. */
  darkKey: ColorThemeKey;
  setLightTheme: (key: ColorThemeKey) => void;
  setDarkTheme: (key: ColorThemeKey) => void;
  toggleLightDark: () => void;
}

/**
 * Shared light/dark selection store. The *active* theme stays upstream's
 * single source of truth (`useColorTheme`/`setColorTheme`); this only tracks
 * which light and dark palettes the sidebar Sun/Moon button toggles between.
 */
export const useColorThemeSettingsStore = create<ColorThemeSettingsState>()(
  (set, get) => ({
    lightKey: readStoredThemeKey(
      LIGHT_THEME_STORAGE_KEY,
      LIGHT_COLOR_THEME_KEYS,
      DEFAULT_LIGHT_COLOR_THEME,
    ),
    darkKey: readStoredThemeKey(
      DARK_THEME_STORAGE_KEY,
      DARK_COLOR_THEME_KEYS,
      DEFAULT_DARK_COLOR_THEME,
    ),

    /** Reconfigure the Light theme. Applies immediately when in light mode. */
    setLightTheme: (key) => {
      persistThemeKey(LIGHT_THEME_STORAGE_KEY, key);
      set({ lightKey: key });
      if (COLOR_THEMES[getActiveColorTheme()].appearance === "light") {
        setColorTheme(key);
      }
    },

    /** Reconfigure the Dark theme. Applies immediately when in dark mode. */
    setDarkTheme: (key) => {
      persistThemeKey(DARK_THEME_STORAGE_KEY, key);
      set({ darkKey: key });
      if (COLOR_THEMES[getActiveColorTheme()].appearance === "dark") {
        setColorTheme(key);
      }
    },

    /** Flip between the selected light and dark themes. */
    toggleLightDark: () => {
      const { lightKey, darkKey } = get();
      const next =
        COLOR_THEMES[getActiveColorTheme()].appearance === "light"
          ? darkKey
          : lightKey;
      setColorTheme(next);
    },
  }),
);

/**
 * Read/write access to the color-theme setup. The user configures two themes
 * in Settings → App — a Light theme and a Dark theme — and the sidebar
 * Sun/Moon button toggles between them. `theme` is the currently applied key;
 * `isLight` reflects whether the applied theme is light-natured.
 */
export function useColorThemeSettings() {
  const theme = useColorTheme();
  const lightKey = useColorThemeSettingsStore((s) => s.lightKey);
  const darkKey = useColorThemeSettingsStore((s) => s.darkKey);
  const setLightTheme = useColorThemeSettingsStore((s) => s.setLightTheme);
  const setDarkTheme = useColorThemeSettingsStore((s) => s.setDarkTheme);
  const toggleLightDark = useColorThemeSettingsStore((s) => s.toggleLightDark);

  return {
    theme,
    lightKey,
    darkKey,
    isLight: COLOR_THEMES[theme].appearance === "light",
    setLightTheme,
    setDarkTheme,
    toggleLightDark,
  };
}
