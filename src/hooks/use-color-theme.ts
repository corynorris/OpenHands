import { useCallback, useState } from "react";
import {
  DEFAULT_COLOR_THEME,
  applyColorTheme,
  persistColorTheme,
  readPersistedColorTheme,
  type ColorThemeKey,
} from "#/themes/color-themes";

/** Key of the light theme; everything else is treated as dark. */
export const LIGHT_COLOR_THEME: ColorThemeKey = "openhands-light";

/**
 * Read/write access to the persisted color theme. Keeps a local copy in sync
 * with localStorage so the Settings dropdown (which reads directly from
 * localStorage via `readPersistedColorTheme`) and this hook agree.
 */
export function useColorTheme() {
  const [theme, setThemeState] = useState<ColorThemeKey>(() =>
    readPersistedColorTheme(),
  );

  const setTheme = useCallback((next: ColorThemeKey) => {
    applyColorTheme(next);
    persistColorTheme(next);
    setThemeState(next);
  }, []);

  const toggleLightDark = useCallback(() => {
    const next =
      theme === LIGHT_COLOR_THEME ? DEFAULT_COLOR_THEME : LIGHT_COLOR_THEME;
    setTheme(next);
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleLightDark,
    isLight: theme === LIGHT_COLOR_THEME,
  };
}
