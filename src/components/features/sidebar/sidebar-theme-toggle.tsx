import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useColorTheme } from "#/hooks/use-color-theme";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { SidebarCollapsedIconSlot } from "./sidebar-collapsed-icon-slot";
import {
  SIDEBAR_ICON_BUTTON_CLASS,
  sidebarNavLabelClassName,
  sidebarNavRowClassName,
} from "./sidebar-layout";

/**
 * Sun/Moon quick toggle for the color theme. In the expanded sidebar it
 * renders as a bare icon button in the header row (top right); in the
 * collapsed rail it renders as a nav-row icon slot near Settings. Persists
 * via localStorage (same storage the Settings → App → Theme dropdown uses).
 */
export function SidebarThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { isLight, toggleLightDark } = useColorTheme();
  const { t } = useTranslation("openhands");
  const label = isLight
    ? t(I18nKey.SIDEBAR$SWITCH_TO_DARK)
    : t(I18nKey.SIDEBAR$SWITCH_TO_LIGHT);
  const Icon = isLight ? Moon : Sun;

  if (collapsed) {
    const collapsedButton = (
      <button
        type="button"
        onClick={toggleLightDark}
        data-testid="sidebar-theme-toggle"
        aria-label={label}
        title={label}
        className={sidebarNavRowClassName({ collapsed: true })}
      >
        <SidebarCollapsedIconSlot active={false}>
          <Icon width={18} height={18} />
        </SidebarCollapsedIconSlot>
        <span className={sidebarNavLabelClassName(true)}>{label}</span>
      </button>
    );
    return (
      <StyledTooltip content={label} placement="right">
        {collapsedButton}
      </StyledTooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLightDark}
      data-testid="sidebar-theme-toggle"
      aria-label={label}
      title={label}
      className={cn(
        SIDEBAR_ICON_BUTTON_CLASS,
        "text-[var(--oh-muted)] hover:text-[var(--oh-foreground)] hover:bg-[var(--oh-surface-raised)]",
      )}
    >
      <Icon width={18} height={18} />
    </button>
  );
}
