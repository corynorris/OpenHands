import React from "react";
import { createPortal } from "react-dom";
import { FileSearch, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useWorkspaceFiles } from "#/hooks/query/use-workspace-files";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import { useFilesTabStore } from "#/stores/files-tab-store";
import { useSelectConversationTab } from "#/hooks/use-select-conversation-tab";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

const FILE_SWITCHER_SHORTCUT_KEY = "p";
const FILE_SWITCHER_INPUT_ID = "file-switcher-input";
const FILE_SWITCHER_LISTBOX_ID = "file-switcher-results";
const FILE_SWITCHER_OPTION_ID_PREFIX = "file-switcher-option";
const FILE_SWITCHER_TEST_ID = "file-switcher";

/** Cap the rendered list so a broad query over a huge repo can't freeze the UI. */
const MAX_RESULTS = 200;

function getOptionId(index: number) {
  return `${FILE_SWITCHER_OPTION_ID_PREFIX}-${index}`;
}

/**
 * VS Code-style file switcher. Ctrl/Cmd+P opens a modal with an input and a
 * flat, filterable list of the workspace's files; Enter (or a click) opens
 * the selected file in the Files tab. Left arrow keys navigate, Esc closes.
 *
 * The Ctrl+K command menu is untouched — this binds only (Ctrl|Meta)+P, whose
 * default (browser print dialog) is prevented.
 */
export function FileSwitcher() {
  const { t } = useTranslation("openhands");
  const { conversationId } = useOptionalConversationId();
  const { navigateToTab } = useSelectConversationTab();
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // The workspace enumeration is expensive (a `find` over the whole tree on
  // local backends), so it only starts once the switcher has been opened.
  const filesQuery = useWorkspaceFiles(isOpen);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLocaleLowerCase() === FILE_SWITCHER_SHORTCUT_KEY
      ) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveIndex(0);
      return undefined;
    }

    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const filtered = React.useMemo(() => {
    const paths = filesQuery.data ?? [];
    const lowerQuery = query.trim().toLocaleLowerCase();

    if (!lowerQuery) {
      return [...paths]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, MAX_RESULTS);
    }

    // Filename-bonus ordering: a match in the basename ranks above a match
    // anywhere in the full path; within each group, alphabetical.
    const withScore = paths.map((path) => {
      const basename = path.split("/").pop() ?? path;
      const baseScore = basename.toLocaleLowerCase().includes(lowerQuery)
        ? 2
        : path.toLocaleLowerCase().includes(lowerQuery)
          ? 1
          : 0;
      return { path, baseScore };
    });

    return withScore
      .filter(({ baseScore }) => baseScore > 0)
      .sort((a, b) =>
        b.baseScore !== a.baseScore
          ? b.baseScore - a.baseScore
          : a.path.localeCompare(b.path),
      )
      .slice(0, MAX_RESULTS)
      .map(({ path }) => path);
  }, [filesQuery.data, query]);

  React.useEffect(() => {
    setActiveIndex((currentIndex) => {
      if (filtered.length === 0) return -1;
      return Math.min(Math.max(currentIndex, 0), filtered.length - 1);
    });
  }, [filtered.length]);

  // Pull the store action in a stable way (the store hook identity is stable;
  // conversationId guards cross-conversation leakage like the Files tab).
  const setSelectedPathForConversation = React.useCallback(
    (path: string) =>
      useFilesTabStore.getState().setSelectedPath(path, conversationId),
    [conversationId],
  );

  const openFile = React.useCallback(
    (path: string) => {
      setIsOpen(false);
      setSelectedPathForConversation(path);
      navigateToTab("files");
    },
    [navigateToTab, setSelectedPathForConversation],
  );

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        filtered.length === 0 ? index : (index + 1) % filtered.length,
      );
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        filtered.length === 0
          ? index
          : (index - 1 + filtered.length) % filtered.length,
      );
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const path = filtered[activeIndex];
      if (path) openFile(path);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const isLoading = filesQuery.isLoading || filesQuery.data === undefined;
  const hasResults = filtered.length > 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center px-3 pt-[10vh] sm:px-6"
      data-testid={FILE_SWITCHER_TEST_ID}
      role="dialog"
      aria-modal="true"
      aria-label={t(I18nKey.FILE_SWITCHER$ARIA_LABEL)}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-[2px]"
        aria-label={t(I18nKey.FILE_SWITCHER$CLOSE_LABEL)}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={cn(
          "relative flex max-h-[min(640px,72vh)] w-full max-w-xl flex-col overflow-hidden rounded-2xl",
          "border border-[var(--oh-border)] bg-[var(--oh-surface)]",
          "shadow-[0_24px_90px_rgba(0,0,0,0.52),0_0_0_1px_rgba(255,255,255,0.03)_inset]",
        )}
      >
        <div className="relative flex items-center gap-3 border-b border-[var(--oh-border)] px-4 py-3">
          <Search className="size-5 shrink-0 text-[var(--oh-text-dim)]" />
          <input
            ref={inputRef}
            id={FILE_SWITCHER_INPUT_ID}
            className="h-11 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-[var(--oh-text-dim)]"
            placeholder={t(I18nKey.FILE_SWITCHER$PLACEHOLDER)}
            aria-label={t(I18nKey.FILE_SWITCHER$SEARCH_LABEL)}
            role="combobox"
            aria-expanded="true"
            aria-controls={FILE_SWITCHER_LISTBOX_ID}
            aria-activedescendant={
              hasResults ? getOptionId(activeIndex) : undefined
            }
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          {query ? (
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-lg text-[var(--oh-muted)] hover:bg-[var(--oh-surface-raised)] hover:text-white"
              aria-label={t(I18nKey.FILE_SWITCHER$CLEAR_SEARCH_LABEL)}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X className="size-4" />
            </button>
          ) : null}
          <kbd className="hidden rounded-md border border-[var(--oh-border)] bg-black/25 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--oh-text-dim)] sm:inline-flex">
            {t(I18nKey.COMMAND_MENU$SHORTCUT)}
          </kbd>
        </div>

        <div
          id={FILE_SWITCHER_LISTBOX_ID}
          role="listbox"
          className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2 custom-scrollbar"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-dashed border-[var(--oh-border)] text-[var(--oh-text-dim)]">
                <FileSearch className="size-5" />
              </div>
              <p className="text-sm font-medium text-white">
                {t(I18nKey.FILE_SWITCHER$LOADING)}
              </p>
            </div>
          ) : !hasResults ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-dashed border-[var(--oh-border)] text-[var(--oh-text-dim)]">
                <Search className="size-5" />
              </div>
              <p className="text-sm font-medium text-white">
                {t(I18nKey.FILE_SWITCHER$NO_RESULTS)}
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5 py-1">
              {filtered.map((path, index) => {
                const isActive = index === activeIndex;
                const fileName = path.split("/").pop() || path;
                return (
                  <li
                    key={path}
                    role="option"
                    id={getOptionId(index)}
                    aria-selected={isActive}
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => openFile(path)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left",
                        isActive
                          ? "bg-[var(--oh-interactive-active)] text-white"
                          : "text-[var(--oh-muted)] hover:bg-[var(--oh-surface-raised)]",
                      )}
                    >
                      <span className="truncate font-mono text-xs text-inherit">
                        {path}
                      </span>
                      <span className="ml-auto shrink-0 rounded border border-[var(--oh-border)] px-1.5 py-0.5 text-[10px] text-[var(--oh-text-dim)]">
                        {fileName}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
