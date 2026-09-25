import { create } from "zustand";
import {
  applyColorTheme,
  isColorThemeLight,
  persistColorTheme,
  persistDarkThemeKey,
  persistLightThemeKey,
  readPersistedColorTheme,
  readPersistedDarkThemeKey,
  readPersistedLightThemeKey,
  type ColorThemeKey,
} from "#/themes/color-themes";

interface ColorThemeState {
  /** The currently applied theme key. */
  theme: ColorThemeKey;
  /** The theme selected for light mode in Settings → App → Light theme. */
  lightKey: ColorThemeKey;
  /** The theme selected for dark mode in Settings → App → Dark theme. */
  darkKey: ColorThemeKey;
  setLightTheme: (key: ColorThemeKey) => void;
  setDarkTheme: (key: ColorThemeKey) => void;
  toggleLightDark: () => void;
}

/**
 * Shared color-theme store. Lives in zustand (rather than per-component
 * `useState`) so every consumer — the Settings pickers and the sidebar
 * Sun/Moon toggle — reads and writes the SAME `lightKey`/`darkKey`/`theme`.
 * With per-hook state, the sidebar toggle kept a stale copy of the picker
 * selections and ignored changes made in Settings.
 */
export const useColorThemeStore = create<ColorThemeState>()((set, get) => ({
  theme: readPersistedColorTheme(),
  lightKey: readPersistedLightThemeKey(),
  darkKey: readPersistedDarkThemeKey(),

  /** Reconfigure the Light theme. Applies immediately when in light mode. */
  setLightTheme: (key) => {
    persistLightThemeKey(key);
    set({ lightKey: key });
    if (isColorThemeLight(get().theme)) {
      applyColorTheme(key);
      persistColorTheme(key);
      set({ theme: key });
    }
  },

  /** Reconfigure the Dark theme. Applies immediately when in dark mode. */
  setDarkTheme: (key) => {
    persistDarkThemeKey(key);
    set({ darkKey: key });
    if (!isColorThemeLight(get().theme)) {
      applyColorTheme(key);
      persistColorTheme(key);
      set({ theme: key });
    }
  },

  /** Flip between the selected light and dark themes. */
  toggleLightDark: () => {
    const { theme, darkKey, lightKey } = get();
    const next = isColorThemeLight(theme) ? darkKey : lightKey;
    applyColorTheme(next);
    persistColorTheme(next);
    set({ theme: next });
  },
}));

/**
 * Read/write access to the color theme setup. The user configures two themes
 * in Settings → App — a Light theme and a Dark theme — and the sidebar
 * Sun/Moon button toggles between them. `theme` is the currently applied key;
 * `isLight` reflects whether the applied theme is light-natured.
 */
export function useColorTheme() {
  const theme = useColorThemeStore((s) => s.theme);
  const lightKey = useColorThemeStore((s) => s.lightKey);
  const darkKey = useColorThemeStore((s) => s.darkKey);
  const setLightTheme = useColorThemeStore((s) => s.setLightTheme);
  const setDarkTheme = useColorThemeStore((s) => s.setDarkTheme);
  const toggleLightDark = useColorThemeStore((s) => s.toggleLightDark);

  return {
    theme,
    lightKey,
    darkKey,
    isLight: isColorThemeLight(theme),
    setLightTheme,
    setDarkTheme,
    toggleLightDark,
  };
}
