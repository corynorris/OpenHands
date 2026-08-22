import { useMemo } from "react";

import FileIcon from "#/icons/file.svg?react";

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
  const visible = useMemo(() => paths.slice(0, MAX_RESULTS), [paths]);

  if (paths.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-[var(--oh-muted)]">
        No matching files.
      </div>
    );
  }

  return (
    <div className="py-1">
      {paths.length > MAX_RESULTS && (
        <div className="px-3 pb-1 text-xs text-[var(--oh-muted)]">
          {paths.length} matches — showing first {MAX_RESULTS}. Refine your
          query.
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
              <FileIcon className="size-3.5 shrink-0" />
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
