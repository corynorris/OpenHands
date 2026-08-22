import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, FileDiff, RefreshCw } from "lucide-react";
import { useUnifiedGetGitChanges } from "#/hooks/query/use-unified-get-git-changes";
import { useUnifiedGitDiff } from "#/hooks/query/use-unified-git-diff";
import type { GitChange, GitChangeStatus } from "#/api/open-hands.types";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { ConversationTabEmptyState } from "#/components/features/conversation/conversation-tab-empty-state";
import { PrPatchView } from "./pr-patch-view";

/**
 * "Changes" right-drawer tab: GitHub-style review of the conversation's
 * working-tree changes. List header with a live count + refresh, one row per
 * changed file (status letter + path + +/- stat), click to expand the
 * unified diff (compact hunk renderer, no Monaco). The diff for a row only
 * loads once that row is expanded — a large changeset stays cheap.
 *
 * Backed by the same local-git plumbing as the Commits tab
 * (`useUnifiedGetGitChanges` / `useUnifiedGitDiff`), so it works on local
 * workspaces without any provider connection.
 */

/** Single-letter git status for the row gutter. */
function statusLetter(status: GitChangeStatus): string {
  switch (status) {
    case "A":
      return "A";
    case "D":
      return "D";
    case "R":
      return "R";
    default:
      return "M"; // M and U both render as modified
  }
}

/** Row colour for the status letter (module scope, outside JSX). */
function statusClass(status: GitChangeStatus): string {
  switch (status) {
    case "A":
      return "text-emerald-500";
    case "D":
      return "text-red-500";
    case "R":
      return "text-violet-500";
    default:
      return "text-[var(--oh-text-secondary)]";
  }
}

/** Count +/- lines in a unified diff string, ignoring the header lines. */
function countDiffStats(diff: string | null | undefined): {
  additions: number;
  deletions: number;
} | null {
  if (!diff) return null;
  let additions = 0;
  let deletions = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) additions += 1;
    else if (line.startsWith("-") && !line.startsWith("---")) deletions += 1;
  }
  return { additions, deletions };
}

function ChangeRow({ change }: { change: GitChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Renamed paths come back as "old -> new" — show the new path (same
  // normalization as the Commits tab's diff viewer).
  const filePath =
    change.status === "R"
      ? (change.path.split(/\s+/).slice(1).pop() ?? change.path)
      : change.path;

  // Lazy per-row diff: the request only fires once the row is expanded.
  const { data: diff } = useUnifiedGitDiff({
    filePath,
    type: change.status,
    enabled: isExpanded,
  });

  const stats = countDiffStats(diff?.diff);

  return (
    <li className="border-t border-[var(--oh-border-subtle)] first:border-t-0">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        title={change.path}
        className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-[var(--oh-surface-raised)]"
      >
        {isExpanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-[var(--oh-muted)]" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-[var(--oh-muted)]" />
        )}
        <span
          className={cn(
            "w-4 shrink-0 text-center font-mono text-[11px] font-semibold",
            statusClass(change.status),
          )}
        >
          {statusLetter(change.status)}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--oh-foreground)]">
          {filePath}
        </span>
        {stats ? (
          <span className="shrink-0 whitespace-nowrap font-mono text-[11px]">
            {stats.additions > 0 ? (
              <span className="text-emerald-500">+{stats.additions}</span>
            ) : null}
            {stats.deletions > 0 ? (
              <span className="text-red-500"> −{stats.deletions}</span>
            ) : null}
          </span>
        ) : (
          <span className="shrink-0 font-mono text-[11px] text-[var(--oh-text-dim)]">
            —
          </span>
        )}
      </button>
      {isExpanded ? (
        <div className="border-t border-[var(--oh-border-subtle)] bg-[var(--oh-surface-deep)]">
          <PrPatchView patch={diff?.diff} />
        </div>
      ) : null}
    </li>
  );
}

export function ChangesReview() {
  const { t } = useTranslation("openhands");
  const {
    data: changes,
    isLoading,
    isError,
    refetch,
  } = useUnifiedGetGitChanges();

  if (isLoading) {
    return (
      <p className="px-4 py-6 text-sm text-[var(--oh-muted)]">
        {t(I18nKey.HOME$LOADING)}
      </p>
    );
  }

  if (isError) {
    return (
      <ConversationTabEmptyState icon={<FileDiff />}>
        {t(I18nKey.DIFF_VIEWER$NO_CHANGES)}
      </ConversationTabEmptyState>
    );
  }

  if (!changes || changes.length === 0) {
    return (
      <ConversationTabEmptyState icon={<FileDiff />}>
        {t(I18nKey.DIFF_VIEWER$NO_CHANGES)}
      </ConversationTabEmptyState>
    );
  }

  return (
    <main data-testid="changes-review" className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--oh-border)] px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--oh-text-dim)]">
          {t(I18nKey.COMMON$CHANGES)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--oh-muted)]">
            {changes.length} {t(I18nKey.PR$CHANGED_FILES)}
          </span>
          <button
            type="button"
            data-testid="changes-review-refresh"
            aria-label={t(I18nKey.BUTTON$REFRESH)}
            title={t(I18nKey.BUTTON$REFRESH)}
            onClick={() => {
              void refetch();
            }}
            className="inline-flex size-6 shrink-0 items-center justify-center rounded text-[var(--oh-muted)] transition-colors hover:bg-[var(--oh-surface-raised)] hover:text-[var(--oh-foreground)]"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto py-1 custom-scrollbar">
        {changes.map((change) => (
          <ChangeRow key={change.path} change={change} />
        ))}
      </ul>
    </main>
  );
}
