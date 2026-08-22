import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GitPullRequest,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { useConversationPrimaryRepository } from "#/hooks/use-conversation-primary-repository";
import {
  usePullRequestBundle,
  useRepositoryPullRequests,
} from "#/hooks/query/use-repository-git-items";
import { GitProviderItemsService } from "#/api/git-provider-items-service";
import type { PullRequestFile } from "#/api/git-provider-items-service";
import type { Provider } from "#/types/settings";
import { I18nKey } from "#/i18n/declaration";
import { cn, getProviderName } from "#/utils/utils";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { ConversationTabEmptyState } from "#/components/features/conversation/conversation-tab-empty-state";
import { PrPatchView } from "./pr-patch-view";

/**
 * Read-only PR review tab (v1). Lists open pull requests for the connected
 * repository and lets the user open a detail view with header stats, commits,
 * a files-changed accordion (compact hunk renderer, no Monaco) and review
 * comments. GitHub is fully implemented; GitLab mirrors the same endpoints;
 * Bitbucket / Forgejo render the list with external links only.
 */

function PrStateBadge({ state }: { state: "open" | "closed" | "merged" }) {
  const { t } = useTranslation("openhands");
  const config = {
    open: {
      label: t(I18nKey.PR$OPEN),
      className: "bg-emerald-500/15 text-emerald-400",
    },
    closed: {
      label: t(I18nKey.PR$CLOSED),
      className: "bg-red-500/15 text-red-400",
    },
    merged: {
      label: t(I18nKey.PR$MERGED),
      className: "bg-violet-500/15 text-violet-400",
    },
  }[state];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}

/** Single-letter git change status (module scope, outside JSX). */
function fileStatusLabel(status: PullRequestFile["status"]): string {
  switch (status) {
    case "added":
      return "A";
    case "removed":
      return "D";
    case "renamed":
      return "R";
    default:
      return "M";
  }
}

/** Row colour for the status letter (module scope, outside JSX). */
function fileStatusClass(status: PullRequestFile["status"]): string {
  switch (status) {
    case "added":
      return "text-emerald-400";
    case "removed":
      return "text-red-400";
    default:
      return "text-[var(--oh-text-secondary)]";
  }
}

function formatDiffStat(
  additions: number | null | undefined,
  deletions: number | null | undefined,
) {
  if (additions == null && deletions == null) return null;
  return (
    <span className="shrink-0 whitespace-nowrap font-mono text-[11px]">
      {additions ? (
        <span className="text-emerald-400">+{additions}</span>
      ) : null}
      {deletions ? <span className="text-red-400"> −{deletions}</span> : null}
    </span>
  );
}

function PrList({
  repository,
  provider,
  onSelect,
}: {
  repository: string;
  provider: Provider;
  onSelect: (number: number) => void;
}) {
  const { t, i18n } = useTranslation("openhands");
  const query = useRepositoryPullRequests(repository, provider);
  // v1: bitbucket / forgejo are list + external link only.
  const externalOnly = provider === "bitbucket" || provider === "forgejo";

  const externalListUrl = GitProviderItemsService.constructPullRequestsListUrl(
    provider,
    repository,
  );

  if (query.isLoading) {
    return (
      <p className="px-4 py-6 text-sm text-[var(--oh-muted)]">
        {t(I18nKey.HOME$LOADING)}
      </p>
    );
  }

  if (query.isError) {
    return (
      <p className="px-4 py-6 text-sm text-[var(--oh-muted)]">
        {t(I18nKey.CONVERSATION$OVERVIEW_GIT_ITEMS_ERROR)}
      </p>
    );
  }

  if (!query.data || query.data.length === 0) {
    return (
      <ConversationTabEmptyState icon={<GitPullRequest />}>
        {t(I18nKey.PR$NO_OPEN_PRS)}
      </ConversationTabEmptyState>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--oh-border)] px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--oh-text-dim)]">
          {t(I18nKey.PR$TAB_LABEL)}
        </span>
        <a
          href={externalListUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[var(--oh-muted)] transition-colors hover:text-[var(--oh-foreground)]"
        >
          {t(I18nKey.CONVERSATION$OVERVIEW_VIEW_ON_PROVIDER, {
            provider: getProviderName(provider),
          })}
        </a>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto py-1 custom-scrollbar">
        {query.data.map((pr) => {
          const label = `#${pr.number} · ${pr.title}`;
          const body = (
            <>
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--oh-foreground)]">
                {pr.title}
              </span>
              <span className="shrink-0 text-xs text-[var(--oh-text-dim)]">
                #{pr.number}
              </span>
            </>
          );
          return (
            <li key={pr.id}>
              {externalOnly ? (
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  className="flex w-full items-center gap-2 px-4 py-2 hover:bg-[var(--oh-surface-raised)]"
                >
                  {body}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(pr.number)}
                  title={label}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-[var(--oh-surface-raised)]"
                >
                  {body}
                </button>
              )}
              <div className="flex items-center gap-2 px-4 pb-2 text-[11px] text-[var(--oh-text-dim)]">
                {pr.authorLogin ? (
                  <span className="truncate">{pr.authorLogin}</span>
                ) : null}
                {pr.updatedAt ? (
                  <span className="shrink-0">
                    {formatRelativeTime(pr.updatedAt, i18n.language, t)}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FileAccordion({ files }: { files: PullRequestFile[] }) {
  const { t } = useTranslation("openhands");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (filename: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  if (files.length === 0) {
    return (
      <p className="px-4 py-3 text-xs text-[var(--oh-muted)]">
        {t(I18nKey.PR$NO_FILES)}
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {files.map((file) => {
        const isExpanded = expanded.has(file.filename);
        const statusLabel = fileStatusLabel(file.status);
        const statusClass = fileStatusClass(file.status);
        return (
          <li
            key={file.filename}
            className="border-t border-[var(--oh-border-subtle)]"
          >
            <button
              type="button"
              onClick={() => toggle(file.filename)}
              aria-expanded={isExpanded}
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
                  statusClass,
                )}
              >
                {statusLabel}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs text-[var(--oh-text-tertiary)]">
                {file.filename}
              </span>
              {formatDiffStat(file.additions, file.deletions)}
            </button>
            {isExpanded ? (
              <div className="border-t border-[var(--oh-border-subtle)] bg-[var(--oh-surface-deep)]">
                <PrPatchView patch={file.patch} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function PrDetail({
  repository,
  provider,
  number,
  onBack,
}: {
  repository: string;
  provider: Provider;
  number: number;
  onBack: () => void;
}) {
  const { t, i18n } = useTranslation("openhands");
  const { data, isLoading, isError } = usePullRequestBundle(
    repository,
    provider,
    number,
  );

  const detail = data?.detail ?? null;

  const header = (
    <div className="flex shrink-0 items-center gap-2 border-b border-[var(--oh-border)] px-3 py-2">
      <button
        type="button"
        onClick={onBack}
        aria-label={t(I18nKey.PR$BACK)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--oh-muted)] hover:bg-[var(--oh-surface-raised)] hover:text-white"
      >
        <ArrowLeft className="size-4" />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--oh-foreground)]">
        {detail ? `${detail.title}` : `#${number}`}
      </span>
      {detail?.htmlUrl ? (
        <a
          href={detail.htmlUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs text-[var(--oh-muted)] transition-colors hover:text-[var(--oh-foreground)]"
        >
          {t(I18nKey.CONVERSATION$OVERVIEW_VIEW_ON_PROVIDER, {
            provider: getProviderName(provider),
          })}
        </a>
      ) : null}
    </div>
  );

  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <p className="px-4 py-6 text-sm text-[var(--oh-muted)]">
          {t(I18nKey.HOME$LOADING)}
        </p>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <p className="px-4 py-6 text-sm text-[var(--oh-muted)]">
          {t(I18nKey.CONVERSATION$OVERVIEW_GIT_ITEMS_ERROR)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
        {/* Title / author / state / stats */}
        <div className="border-b border-[var(--oh-border)] px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="min-w-0 flex-1 text-sm font-medium leading-5 text-[var(--oh-foreground)]">
              {detail.title}
            </h2>
            <span className="shrink-0 text-xs text-[var(--oh-text-dim)]">
              #{detail.number}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--oh-muted)]">
            <PrStateBadge state={detail.state} />
            {detail.mergeable != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  detail.mergeable
                    ? "text-emerald-400"
                    : "text-[var(--oh-warning)]",
                )}
              >
                {detail.mergeable ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <XCircle className="size-3.5" />
                )}
                {detail.mergeable
                  ? t(I18nKey.PR$MERGEABLE)
                  : t(I18nKey.PR$NOT_MERGEABLE)}
              </span>
            )}
            {formatDiffStat(detail.additions, detail.deletions)}
            {detail.authorLogin ? (
              <span className="truncate">{detail.authorLogin}</span>
            ) : null}
            {detail.updatedAt ? (
              <span className="shrink-0">
                {formatRelativeTime(detail.updatedAt, i18n.language, t)}
              </span>
            ) : null}
          </div>
          {detail.body ? (
            <p className="mt-3 whitespace-pre-wrap text-xs leading-5 text-[var(--oh-text-secondary)]">
              {detail.body}
            </p>
          ) : null}
        </div>

        {/* Commits */}
        <section className="border-b border-[var(--oh-border)] px-4 py-3">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--oh-text-dim)]">
            {t(I18nKey.PR$COMMITS)} ({data.commits.length})
          </h3>
          {data.commits.length === 0 ? (
            <p className="text-xs text-[var(--oh-muted)]">
              {t(I18nKey.PR$NO_COMMITS)}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {data.commits.slice(0, 20).map((commit) => (
                <li key={commit.sha} className="flex items-baseline gap-2">
                  <span className="shrink-0 font-mono text-[11px] text-[var(--oh-text-dim)]">
                    {commit.sha.slice(0, 7)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-[var(--oh-text-tertiary)]">
                    {commit.message}
                  </span>
                  {commit.date ? (
                    <span className="shrink-0 text-[11px] text-[var(--oh-text-dim)]">
                      {formatRelativeTime(commit.date, i18n.language, t)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Files changed */}
        <section className="border-b border-[var(--oh-border)]">
          <h3 className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--oh-text-dim)]">
            {t(I18nKey.PR$FILES_CHANGED)} ({data.files.length})
          </h3>
          <FileAccordion files={data.files} />
        </section>

        {/* Review comments */}
        <section className="px-4 py-3">
          <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--oh-text-dim)]">
            {t(I18nKey.PR$REVIEW_COMMENTS)} ({data.reviewComments.length})
          </h3>
          {data.reviewComments.length === 0 ? (
            <p className="text-xs text-[var(--oh-muted)]">
              {t(I18nKey.PR$NO_COMMENTS)}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.reviewComments.map((comment) => (
                <li
                  key={comment.id}
                  className="rounded-lg border border-[var(--oh-border-subtle)] bg-[var(--oh-surface-raised)] p-3"
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px] text-[var(--oh-muted)]">
                    <MessageSquare className="size-3 shrink-0" />
                    {comment.authorLogin ? (
                      <span className="shrink-0 font-medium text-[var(--oh-text-secondary)]">
                        {comment.authorLogin}
                      </span>
                    ) : null}
                    {comment.path ? (
                      <span className="min-w-0 flex-1 truncate font-mono text-[var(--oh-text-dim)]">
                        {comment.path}
                        {comment.line != null ? `:${comment.line}` : ""}
                      </span>
                    ) : null}
                    {comment.createdAt ? (
                      <span className="shrink-0">
                        {formatRelativeTime(
                          comment.createdAt,
                          i18n.language,
                          t,
                        )}
                      </span>
                    ) : null}
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-5 text-[var(--oh-text-tertiary)]">
                    {comment.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export function PrReviewTab() {
  const { t } = useTranslation("openhands");
  const { repository, provider, isConnected } =
    useConversationPrimaryRepository();
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  if (!isConnected || !repository || !provider) {
    return (
      <ConversationTabEmptyState icon={<GitPullRequest />}>
        {t(I18nKey.PR$NO_REPO)}
      </ConversationTabEmptyState>
    );
  }

  if (selectedNumber != null) {
    return (
      <PrDetail
        repository={repository}
        provider={provider}
        number={selectedNumber}
        onBack={() => setSelectedNumber(null)}
      />
    );
  }

  return (
    <PrList
      repository={repository}
      provider={provider}
      onSelect={setSelectedNumber}
    />
  );
}
