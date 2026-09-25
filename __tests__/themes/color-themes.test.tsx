import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentServerUIRoot } from "#/components/providers/agent-server-ui-root";
import {
  AVAILABLE_COLOR_THEMES,
  COLOR_THEMES,
  DARK_COLOR_THEME_KEYS,
  DEFAULT_DARK_COLOR_THEME,
  DEFAULT_LIGHT_COLOR_THEME,
  LIGHT_COLOR_THEME_KEYS,
  applyColorTheme,
  persistDarkThemeKey,
  persistLightThemeKey,
  readPersistedColorTheme,
  readPersistedDarkThemeKey,
  readPersistedLightThemeKey,
} from "#/themes/color-themes";

describe("color themes", () => {
  it("offers four themes grouped into dark and light pickers", () => {
    expect(AVAILABLE_COLOR_THEMES.map((theme) => theme.key).sort()).toEqual([
      "openhands-deepsea",
      "openhands-light",
      "openhands-neo",
      "openhands-neutral",
    ]);
    // Dark-natured: neutral (fork default), deepsea, neo (dark surfaces with
    // white primary buttons). Light-natured: the fork's light theme.
    expect(DARK_COLOR_THEME_KEYS).toEqual([
      "openhands-neutral",
      "openhands-deepsea",
      "openhands-neo",
    ]);
    expect(LIGHT_COLOR_THEME_KEYS).toEqual(["openhands-light"]);

    // Picker labels come from each theme's own definition.
    expect(COLOR_THEMES["openhands-deepsea"].label).toBe("OpenHands-DeepSea");
    expect(COLOR_THEMES["openhands-neutral"].label).toBe("OpenHands-Neutral");
    expect(COLOR_THEMES["openhands-neo"].label).toBe("OpenHands-Neo");
    expect(COLOR_THEMES["openhands-light"].label).toBe("OpenHands-Light");
  });

  it("defaults to the fork's neutral dark theme and light theme", () => {
    expect(DEFAULT_DARK_COLOR_THEME).toBe("openhands-neutral");
    expect(DEFAULT_LIGHT_COLOR_THEME).toBe("openhands-light");
    expect(readPersistedColorTheme()).toBe("openhands-neutral");
    expect(readPersistedDarkThemeKey()).toBe("openhands-neutral");
    expect(readPersistedLightThemeKey()).toBe("openhands-light");
  });

  it("persists the light and dark picker selections independently", () => {
    persistLightThemeKey("openhands-light");
    persistDarkThemeKey("openhands-deepsea");
    expect(readPersistedLightThemeKey()).toBe("openhands-light");
    expect(readPersistedDarkThemeKey()).toBe("openhands-deepsea");

    // A dark-natured key is rejected by the light picker and falls back.
    persistLightThemeKey("openhands-neo");
    expect(readPersistedLightThemeKey()).toBe(DEFAULT_LIGHT_COLOR_THEME);

    // A light-natured key is rejected by the dark picker and falls back.
    persistDarkThemeKey("openhands-light");
    expect(readPersistedDarkThemeKey()).toBe(DEFAULT_DARK_COLOR_THEME);

    window.localStorage.removeItem("openhands-light-theme");
    window.localStorage.removeItem("openhands-dark-theme");
  });

  it("keeps legacy persisted keys (deepsea/neo) valid and rejects unknown ones", () => {
    window.localStorage.setItem("openhands-color-theme", "openhands-neo");
    expect(readPersistedColorTheme()).toBe("openhands-neo");

    window.localStorage.setItem("openhands-color-theme", "openhands-deepsea");
    expect(readPersistedColorTheme()).toBe("openhands-deepsea");

    window.localStorage.setItem("openhands-color-theme", "openhands-light");
    expect(readPersistedColorTheme()).toBe("openhands-light");

    window.localStorage.setItem("openhands-color-theme", "not-a-theme");
    expect(readPersistedColorTheme()).toBe(DEFAULT_DARK_COLOR_THEME);

    window.localStorage.removeItem("openhands-color-theme");
  });

  it("injects override rules with order-independent doubled scope selectors", () => {
    // Act
    applyColorTheme("openhands-neutral");

    // Assert: doubled selectors (0,2,0) out-specify the base sheet's unlayered
    // [data-agent-server-ui] variable rules (0,1,0), so the override wins even
    // when React 19 re-inserts the base stylesheet <link> after this tag.
    const styleEl = document.getElementById("oh-color-theme-override");
    expect(styleEl?.textContent).toContain(
      "[data-agent-server-ui][data-agent-server-ui] {",
    );
    expect(styleEl?.textContent).toContain("[data-theme=dark][data-theme=dark] {");

    styleEl?.remove();
  });

  it("re-appends the override style tag to the end of <head> on every apply", () => {
    // Arrange: first apply creates the tag, then a later stylesheet lands
    // after it (as React 19 does with the base CSS <link> in the built SPA).
    applyColorTheme("openhands-neutral");
    const laterSheet = document.createElement("style");
    document.head.appendChild(laterSheet);

    // Act
    applyColorTheme("openhands-light");

    // Assert
    expect(document.head.lastElementChild?.id).toBe("oh-color-theme-override");

    laterSheet.remove();
    document.getElementById("oh-color-theme-override")?.remove();
  });

  it("emits the white button tokens when OpenHands-Neo is applied", () => {
    applyColorTheme("openhands-neo");
    const styleEl = document.getElementById("oh-color-theme-override");
    expect(styleEl?.textContent).toContain("--oh-color-primary: #ffffff;");
    styleEl?.remove();
  });

  it("applies theme tokens on the scoped UI root used by primary buttons", () => {
    render(
      <AgentServerUIRoot>
        <button type="button" data-testid="primary-button">
          Save
        </button>
      </AgentServerUIRoot>,
    );

    applyColorTheme("openhands-light");

    const scopeRoot = screen.getByTestId("primary-button").closest(
      "[data-agent-server-ui]",
    ) as HTMLElement;

    // The light theme carries no --oh-color-primary override, so the scoped
    // root falls back to its inline default (nothing forced on).
    expect(scopeRoot.style.getPropertyValue("--oh-color-primary")).toBe("");

    applyColorTheme("openhands-neutral");
    expect(COLOR_THEMES["openhands-neutral"].scale["--cool-grey-950"]).toBe(
      "#181818",
    );
  });
});
