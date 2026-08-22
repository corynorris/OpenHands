import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { I18nKey } from "#/i18n/declaration";
import { FileTypeIcon } from "./file-type-icon";

const MAX_RESULTS = 200;

interface FileSearchResultsProps {
  paths: string[];
  onSelectFile: (path: string) => void;
}

/**
 * Flat list of search matches (rendered instead of the tree when a search
 * query is active). `paths` is already filtered; this only bounds how many
 * rows we mount so a broad query can't freeze the UI.
 */
export function FileSearchResults({
  paths,
  onSelectFile,
}: FileSearchResultsProps) {
  const { t } = useTranslation("openhands");
  const visible = useMemo(() => paths.slice(0, MAX_RESULTS), [paths]);

  if (paths.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-[var(--oh-muted)]">
        {t(I18nKey.FILES$SEARCH_NO_MATCHES)}
      </div>
    );
  }

  return (
    <div className="py-1">
      {paths.length > MAX_RESULTS && (
        <div className="px-3 pb-1 text-xs text-[var(--oh-muted)]">
          {t(I18nKey.FILES$SEARCH_TRUNCATED, {
            total: paths.length,
            shown: MAX_RESULTS,
          })}
        </div>
      )}
      <ul>
        {visible.map((path) => (
          <li key={path}>
            <button
              type="button"
              onClick={() => onSelectFile(path)}
              data-testid={`file-search-result-${path}`}
              className="flex w-full items-center gap-1.5 px-3 py-1 text-left hover:bg-tertiary"
            >
              <FileTypeIcon path={path} className="size-3.5" />
              <span className="truncate font-mono text-xs text-[var(--oh-text-tertiary)] hover:text-white">
                {path}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
