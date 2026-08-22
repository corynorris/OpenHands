import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { useWorkspaceIgnoreStore } from "#/stores/workspace-ignore-store";
import { cn } from "#/utils/utils";
import { BrandButton } from "#/components/features/settings/brand-button";
import { displaySuccessToast } from "#/utils/custom-toast-handlers";
import {
  formControlBorderClassName,
  formControlRadiusClassName,
  formControlSurfaceClassName,
} from "#/utils/form-control-classes";

/**
 * Settings → App section: one-pattern-per-line textarea for files/folders to
 * hide from the workspace file tree, the files-tab search and the Ctrl+P file
 * switcher. Saving writes to the persisted workspace-ignore store; the
 * workspace-files query includes the store in its key, so the tree/search
 * refetch on the next open.
 */
export function IgnorePatternsInput() {
  const { t } = useTranslation("openhands");
  const patterns = useWorkspaceIgnoreStore((state) => state.patterns);
  const setPatterns = useWorkspaceIgnoreStore((state) => state.setPatterns);
  const [draft, setDraft] = React.useState(patterns.join("\n"));
  const [hasChanged, setHasChanged] = React.useState(false);

  const handleSave = () => {
    setPatterns(draft.split(/\r?\n/));
    setHasChanged(false);
    displaySuccessToast(t(I18nKey.SETTINGS$SAVED));
  };

  return (
    <div className="border-t border-[var(--oh-border)] pt-6 mt-2">
      <h3 className="text-lg font-medium mb-2">
        {t(I18nKey.SETTINGS$IGNORED_PATTERNS)}
      </h3>
      <p className="mb-4 text-sm leading-5 text-tertiary-light">
        {t(I18nKey.SETTINGS$IGNORED_PATTERNS_DESCRIPTION)}
      </p>
      <textarea
        data-testid="ignored-patterns-textarea"
        aria-label={t(I18nKey.SETTINGS$IGNORED_PATTERNS)}
        placeholder={t(I18nKey.SETTINGS$IGNORED_PATTERNS_PLACEHOLDER)}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setHasChanged(true);
        }}
        rows={6}
        className={cn(
          "w-full min-w-0 px-3 py-2 font-mono text-sm text-[var(--oh-foreground)] placeholder:text-[var(--oh-text-dim)] outline-none",
          formControlRadiusClassName,
          formControlBorderClassName,
          formControlSurfaceClassName,
        )}
      />
      <div className="flex justify-start pt-4">
        <BrandButton
          testId="ignored-patterns-save"
          variant="primary"
          type="button"
          isDisabled={!hasChanged}
          onClick={handleSave}
        >
          {t(I18nKey.SETTINGS$SAVE_CHANGES)}
        </BrandButton>
      </div>
    </div>
  );
}
