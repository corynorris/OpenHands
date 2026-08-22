import { useQuery } from "@tanstack/react-query";
import {
  GitProviderItemsService,
  type PullRequestCommit,
  type PullRequestDetail,
  type PullRequestFile,
  type PullRequestReviewComment,
} from "#/api/git-provider-items-service";
import type { Provider } from "#/types/settings";

export function useRepositoryPullRequests(
  repository: string | null | undefined,
  provider: Provider | null | undefined,
) {
  return useQuery({
    queryKey: ["repository-pull-requests", provider, repository],
    queryFn: () =>
      GitProviderItemsService.listPullRequests(repository!, provider!),
    enabled: Boolean(repository && provider),
    staleTime: 60_000,
    meta: { disableToast: true },
  });
}

export function useRepositoryIssues(
  repository: string | null | undefined,
  provider: Provider | null | undefined,
) {
  return useQuery({
    queryKey: ["repository-issues", provider, repository],
    queryFn: () => GitProviderItemsService.listIssues(repository!, provider!),
    enabled: Boolean(repository && provider),
    staleTime: 60_000,
    meta: { disableToast: true },
  });
}

function usePullRequestQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  enabled: boolean,
) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: 60_000,
    meta: { disableToast: true },
  });
}

export function usePullRequestDetail(
  repository: string | null | undefined,
  provider: Provider | null | undefined,
  number: number | null,
) {
  return usePullRequestQuery<PullRequestDetail | null>(
    ["pull-request-detail", provider, repository, number],
    () =>
      GitProviderItemsService.getPullRequestDetail(
        repository!,
        provider!,
        number!,
      ),
    Boolean(repository && provider && number != null),
  );
}

export function usePullRequestCommits(
  repository: string | null | undefined,
  provider: Provider | null | undefined,
  number: number | null,
) {
  return usePullRequestQuery<PullRequestCommit[]>(
    ["pull-request-commits", provider, repository, number],
    () =>
      GitProviderItemsService.getPullRequestCommits(
        repository!,
        provider!,
        number!,
      ),
    Boolean(repository && provider && number != null),
  );
}

export function usePullRequestFiles(
  repository: string | null | undefined,
  provider: Provider | null | undefined,
  number: number | null,
) {
  return usePullRequestQuery<PullRequestFile[]>(
    ["pull-request-files", provider, repository, number],
    () =>
      GitProviderItemsService.getPullRequestFiles(
        repository!,
        provider!,
        number!,
      ),
    Boolean(repository && provider && number != null),
  );
}

export function usePullRequestReviewComments(
  repository: string | null | undefined,
  provider: Provider | null | undefined,
  number: number | null,
) {
  return usePullRequestQuery<PullRequestReviewComment[]>(
    ["pull-request-review-comments", provider, repository, number],
    () =>
      GitProviderItemsService.getPullRequestReviewComments(
        repository!,
        provider!,
        number!,
      ),
    Boolean(repository && provider && number != null),
  );
}

/**
 * One-request bundle for the PR detail view: fetches the header, commits,
 * changed files and review comments in a single parallel round trip.
 */
export function usePullRequestBundle(
  repository: string | null | undefined,
  provider: Provider | null | undefined,
  number: number | null,
) {
  return useQuery({
    queryKey: ["pull-request-bundle", provider, repository, number],
    queryFn: async () => {
      const [detail, commits, files, reviewComments] = await Promise.all([
        GitProviderItemsService.getPullRequestDetail(
          repository!,
          provider!,
          number!,
        ),
        GitProviderItemsService.getPullRequestCommits(
          repository!,
          provider!,
          number!,
        ),
        GitProviderItemsService.getPullRequestFiles(
          repository!,
          provider!,
          number!,
        ),
        GitProviderItemsService.getPullRequestReviewComments(
          repository!,
          provider!,
          number!,
        ),
      ]);
      return { detail, commits, files, reviewComments };
    },
    enabled: Boolean(repository && provider && number != null),
    staleTime: 60_000,
    meta: { disableToast: true },
  });
}
