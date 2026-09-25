import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { SettingsDropdownInput } from "../settings-dropdown-input";
import { useColorTheme } from "#/hooks/use-color-theme";
import {
  DARK_COLOR_THEMES,
  LIGHT_COLOR_THEMES,
  type ColorThemeKey,
} from "#/themes/color-themes";

/**
 * Settings → App → Color theme. Two pickers replace the old single theme
 * dropdown: the user selects which theme counts as the Light theme and which
 * as the Dark theme; the sidebar Sun/Moon button toggles between the two
 * selections (see useColorTheme).
 */
export function ThemeInput() {
  const { t } = useTranslation("openhands");
  const { lightKey, darkKey, setLightTheme, setDarkTheme } = useColorTheme();

  const handleLightSelectionChange = React.useCallback(
    (key: React.Key | null) => {
      if (!key) return;
      setLightTheme(key as ColorThemeKey);
    },
    [setLightTheme],
  );

  const handleDarkSelectionChange = React.useCallback(
    (key: React.Key | null) => {
      if (!key) return;
      setDarkTheme(key as ColorThemeKey);
    },
    [setDarkTheme],
  );

  return (
    <div
      className="flex w-full flex-col gap-4"
      data-testid="color-theme-inputs"
    >
      <SettingsDropdownInput
        testId="light-theme-input"
        name="light-theme-input"
        label={t(I18nKey.SETTINGS$LIGHT_THEME)}
        items={LIGHT_COLOR_THEMES.map((themeOption) => ({
          key: themeOption.key,
          label: themeOption.label,
        }))}
        defaultSelectedKey={lightKey}
        onSelectionChange={handleLightSelectionChange}
        isClearable={false}
        wrapperClassName="w-full min-w-0"
      />
      <SettingsDropdownInput
        testId="dark-theme-input"
        name="dark-theme-input"
        label={t(I18nKey.SETTINGS$DARK_THEME)}
        items={DARK_COLOR_THEMES.map((themeOption) => ({
          key: themeOption.key,
          label: themeOption.label,
        }))}
        defaultSelectedKey={darkKey}
        onSelectionChange={handleDarkSelectionChange}
        isClearable={false}
        wrapperClassName="w-full min-w-0"
      />
    </div>
  );
}
