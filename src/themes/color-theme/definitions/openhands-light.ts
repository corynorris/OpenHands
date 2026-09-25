import type { AgentServerUICssVariableName } from "#/styles/agent-server-ui-style-scope";
import type { ColorThemeDefinition } from "../types";

// Same neutral grey family as `openhands-neutral`, with the scale flipped so
// dark text lands on white/light-grey surfaces.
const OPENHANDS_LIGHT_SCALE = {
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
};

const OPENHANDS_LIGHT_HEROUI = {
  "--heroui-background": "0 0% 100%",
  "--heroui-background-foreground": "0 0% 12.55%",
  "--heroui-foreground-50": "0 0% 6.27%",
  "--heroui-foreground-100": "0 0% 6.27%",
  "--heroui-foreground-200": "0 0% 9.41%",
  "--heroui-foreground-300": "0 0% 12.55%",
  "--heroui-foreground-400": "0 0% 15.69%",
  "--heroui-foreground-500": "0 0% 19.22%",
  "--heroui-foreground-600": "0 0% 25.1%",
  "--heroui-foreground-700": "0 0% 33.73%",
  "--heroui-foreground-800": "0 0% 45.1%",
  "--heroui-foreground-900": "0 0% 59.22%",
  "--heroui-foreground": "0 0% 12.55%",
  "--heroui-content1": "0 0% 100%",
  "--heroui-content1-foreground": "0 0% 9.41%",
  "--heroui-content2": "0 0% 96.86%",
  "--heroui-content2-foreground": "0 0% 12.55%",
  "--heroui-content3": "0 0% 92.55%",
  "--heroui-content3-foreground": "0 0% 15.69%",
  "--heroui-content4": "0 0% 86.27%",
  "--heroui-content4-foreground": "0 0% 19.22%",
  "--heroui-default-50": "0 0% 98.04%",
  "--heroui-default-100": "0 0% 96.86%",
  "--heroui-default-200": "0 0% 59.22%",
  "--heroui-default-300": "0 0% 33.73%",
  "--heroui-default-400": "0 0% 25.1%",
  "--heroui-default-500": "0 0% 19.22%",
  "--heroui-default-600": "0 0% 15.69%",
  "--heroui-default-700": "0 0% 12.55%",
  "--heroui-default-800": "0 0% 9.41%",
  "--heroui-default-900": "0 0% 6.27%",
  "--heroui-default-foreground": "0 0% 6.27%",
  "--heroui-default": "0 0% 33.73%",
};

/**
 * Interactive/border tokens that don't survive a pure luminance flip (a flipped
 * scale would turn borders near-black), plus the context-window track tokens.
 * Omitted tokens resolve from the base stylesheet.
 */
const OPENHANDS_LIGHT_TOKENS: Partial<
  Record<AgentServerUICssVariableName, string>
> = {
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
  "--oh-context-window-foreground": "#101010",
  "--oh-context-window-track-weight": "50%",
};

export const openhandsLight: ColorThemeDefinition = {
  label: "OpenHands-Light",
  appearance: "light",
  scale: OPENHANDS_LIGHT_SCALE,
  heroui: OPENHANDS_LIGHT_HEROUI,
  tokens: OPENHANDS_LIGHT_TOKENS,
};
