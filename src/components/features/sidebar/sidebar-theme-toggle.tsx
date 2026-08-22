import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useColorTheme } from "#/hooks/use-color-theme";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { SidebarCollapsedIconSlot } from "./sidebar-collapsed-icon-slot";
import {
  SIDEBAR_ICON_SLOT_CLASS,
  sidebarNavLabelClassName,
  sidebarNavRowClassName,
} from "./sidebar-layout";

/**
 * Sun/Moon quick toggle for the color theme, rendered in the sidebar rail
 * near Settings (both collapsed and expanded states). Persists via
 * localStorage (same storage the Settings → App → Theme dropdown uses).
 */
export function SidebarThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { isLight, toggleLightDark } = useColorTheme();
  const { t } = useTranslation("openhands");
  const label = isLight
    ? t(I18nKey.SIDEBAR$SWITCH_TO_DARK)
    : t(I18nKey.SIDEBAR$SWITCH_TO_LIGHT);
  const Icon = isLight ? Moon : Sun;

  const button = (
    <button
      type="button"
      onClick={toggleLightDark}
      data-testid="sidebar-theme-toggle"
      aria-label={label}
      title={collapsed ? label : undefined}
      className={cn(
        sidebarNavRowClassName({ collapsed }),
        !collapsed &&
          "text-[var(--oh-muted)] hover:text-white hover:bg-[var(--oh-surface-raised)]",
      )}
    >
      {collapsed ? (
        <SidebarCollapsedIconSlot active={false}>
          <Icon width={18} height={18} />
        </SidebarCollapsedIconSlot>
      ) : (
        <span className={SIDEBAR_ICON_SLOT_CLASS}>
          <Icon width={18} height={18} />
        </span>
      )}
      <span className={sidebarNavLabelClassName(collapsed)}>{label}</span>
    </button>
  );

  if (!collapsed) return button;

  return (
    <StyledTooltip content={label} placement="right">
      {button}
    </StyledTooltip>
  );
}
