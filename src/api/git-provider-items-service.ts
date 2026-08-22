import { SettingsClient } from "@openhands/typescript-client/clients";
import { getAgentServerClientOptions } from "#/api/agent-server-client-options";
import { SecretsService } from "#/api/secrets-service";
import { getActiveBackend } from "#/api/backend-registry/active-store";
import type { Provider } from "#/types/settings";
import { constructPullRequestUrl, getGitProviderBaseUrl } from "#/utils/utils";

export interface GitProviderItem {
  id: number;
  number: number;
  title: string;
  url: string;
  authorLogin: string | null;
  updatedAt: string | null;
}

const PROVIDER_TOKEN_SECRET_CANDIDATES: Partial<Record<Provider, string[]>> = {
  github: ["GITHUB_TOKEN", "GH_TOKEN", "github"],
  gitlab: ["GITLAB_TOKEN", "GL_TOKEN", "gitlab"],
  bitbucket: ["BITBUCKET_TOKEN", "bitbucket"],
  forgejo: ["FORGEJO_TOKEN", "forgejo"],
};

const LIST_LIMIT = 30;

async function resolveProviderToken(
  provider: Provider,
): Promise<string | null> {
  // Cloud backends keep provider tokens server-side; browser-side secret
  // lookup is only meaningful for the local agent-server secrets store.
  if (getActiveBackend().backend.kind !== "local") {
    return null;
  }

  const candidates = PROVIDER_TOKEN_SECRET_CANDIDATES[provider] ?? [];
  if (candidates.length === 0) {
    return null;
  }

  const secrets = await SecretsService.getSecrets();
  const available = new Set(secrets.map((secret) => secret.name));
  const match = candidates.find((name) => available.has(name));
  if (!match) {
    return null;
  }

  try {
    return await new SettingsClient(getAgentServerClientOptions()).getSecret(
      match,
    );
  } catch {
    return null;
  }
}

function constructIssueUrl(
  issueNumber: number,
  provider: Provider,
  repositoryName: string,
): string {
  const baseUrl = getGitProviderBaseUrl(provider);
  switch (provider) {
    case "gitlab":
      return `${baseUrl}/${repositoryName}/-/issues/${issueNumber}`;
    case "bitbucket":
      return `${baseUrl}/${repositoryName}/issues/${issueNumber}`;
    case "forgejo":
      return `${baseUrl}/${repositoryName}/issues/${issueNumber}`;
    case "github":
    default:
      return `${baseUrl}/${repositoryName}/issues/${issueNumber}`;
  }
}

function constructIssuesListUrl(
  provider: Provider,
  repositoryName: string,
): string {
  const baseUrl = getGitProviderBaseUrl(provider);
  switch (provider) {
    case "gitlab":
      return `${baseUrl}/${repositoryName}/-/issues`;
    case "bitbucket":
      return `${baseUrl}/${repositoryName}/issues`;
    case "forgejo":
      return `${baseUrl}/${repositoryName}/issues`;
    case "github":
    default:
      return `${baseUrl}/${repositoryName}/issues`;
  }
}

function constructPullRequestsListUrl(
  provider: Provider,
  repositoryName: string,
): string {
  const baseUrl = getGitProviderBaseUrl(provider);
  switch (provider) {
    case "gitlab":
      return `${baseUrl}/${repositoryName}/-/merge_requests`;
    case "bitbucket":
      return `${baseUrl}/${repositoryName}/pull-requests`;
    case "forgejo":
      return `${baseUrl}/${repositoryName}/pulls`;
    case "github":
    default:
      return `${baseUrl}/${repositoryName}/pulls`;
  }
}

async function fetchGithubJson<T>(
  path: string,
  token: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function fetchGitlabJson<T>(
  path: string,
  token: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers["PRIVATE-TOKEN"] = token;
  }

  // gitlab.com's public REST API — an external host, not the agent-server
  // `/api` surface the rule guards (its `/api/v4` prefix just trips the
  // substring heuristic; the companion no-direct-agent-server-calls test
  // matches only relative `/api/...` URLs and is not affected).
  // eslint-disable-next-line local/no-direct-agent-server-fetch
  const response = await fetch(`https://gitlab.com/api/v4${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitLab API ${response.status}`);
  }
  return response.json() as Promise<T>;
}

type GithubIssueOrPr = {
  id: number;
  number: number;
  title: string;
  html_url: string;
  user?: { login?: string } | null;
  updated_at?: string | null;
  pull_request?: unknown;
};

type GitlabMergeRequest = {
  id: number;
  iid: number;
  title: string;
  web_url: string;
  author?: { username?: string } | null;
  updated_at?: string | null;
};

type GitlabIssue = {
  id: number;
  iid: number;
  title: string;
  web_url: string;
  author?: { username?: string } | null;
  updated_at?: string | null;
};

/**
 * Lists open pull requests / merge requests and issues for a connected
 * repository by calling the provider's public REST API from the browser.
 * When a matching token secret exists locally (e.g. `GITHUB_TOKEN`), it is
 * used for auth so private repos work; otherwise public-repo unauthenticated
 * requests are attempted.
 */

// ---------------------------------------------------------------------------
// Pull request detail views (read-only v1). GitHub REST is fully implemented;
// GitLab mirrors the same shape from its merge-request endpoints. Bitbucket /
// Forgejo are list-only in v1 (the overview drawer already links out), so the
// detail methods return null for them.
// ---------------------------------------------------------------------------

export interface PullRequestDetail {
  number: number;
  title: string;
  authorLogin: string | null;
  /** "open" | "closed" | "merged" (a merged GitHub PR reports state "closed"). */
  state: "open" | "closed" | "merged";
  mergeable: boolean | null;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
  body: string | null;
  htmlUrl: string;
  headRef: string | null;
  baseRef: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PullRequestCommit {
  sha: string;
  message: string;
  authorName: string | null;
  authorLogin: string | null;
  date: string | null;
}

export interface PullRequestFile {
  filename: string;
  status: "added" | "modified" | "removed" | "renamed" | null;
  additions: number;
  deletions: number;
  changes: number;
  /** Unified diff hunks ("@@ -a,b +c,d @@ …"). May be absent for very large
   *  files — the view then shows the stat line only. */
  patch: string | null;
}

export interface PullRequestReviewComment {
  id: number;
  body: string;
  path: string | null;
  line: number | null;
  authorLogin: string | null;
  createdAt: string | null;
}

type GithubPullRequestDetail = {
  number: number;
  title: string;
  user?: { login?: string } | null;
  state: string;
  merged?: boolean;
  mergeable?: boolean | null;
  additions: number;
  deletions: number;
  changed_files: number;
  body?: string | null;
  html_url: string;
  head?: { ref?: string } | null;
  base?: { ref?: string } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type GithubPullRequestCommit = {
  sha: string;
  commit?: {
    message?: string;
    author?: { name?: string | null; date?: string | null } | null;
  } | null;
  author?: { login?: string } | null;
};

type GithubPullRequestFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
};

type GithubPullRequestComment = {
  id: number;
  body: string;
  path?: string | null;
  line?: number | null;
  user?: { login?: string } | null;
  created_at?: string | null;
};

type GitlabMrDetail = {
  iid: number;
  title: string;
  author?: { username?: string } | null;
  state: string;
  web_url: string;
  changes_count?: string | null;
  description?: string | null;
  source_branch?: string | null;
  target_branch?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type GitlabMrCommit = {
  id: string;
  title: string;
  message?: string | null;
  author_name?: string | null;
  created_at?: string | null;
};

type GitlabMrChange = {
  old_path: string;
  new_path: string;
  new_file?: boolean;
  renamed_file?: boolean;
  deleted_file?: boolean;
  diff: string;
};

type GitlabMrNote = {
  id: number;
  body: string;
  author?: { username?: string } | null;
  created_at?: string | null;
  position?: { new_path?: string | null; new_line?: number | null } | null;
};

function parseGitHubState(
  state: string,
  merged: boolean | undefined,
): PullRequestDetail["state"] {
  if (merged) return "merged";
  return state === "open" ? "open" : "closed";
}

function normalizeFileStatus(status: string): PullRequestFile["status"] {
  switch (status) {
    case "added":
    case "modified":
    case "removed":
    case "renamed":
      return status;
    default:
      return "modified";
  }
}

export class GitProviderItemsService {
  static constructIssuesListUrl = constructIssuesListUrl;

  static constructPullRequestsListUrl = constructPullRequestsListUrl;

  static async listPullRequests(
    repository: string,
    provider: Provider,
  ): Promise<GitProviderItem[]> {
    const token = await resolveProviderToken(provider);

    if (provider === "gitlab") {
      const encoded = encodeURIComponent(repository);
      const items = await fetchGitlabJson<GitlabMergeRequest[]>(
        `/projects/${encoded}/merge_requests?state=opened&per_page=${LIST_LIMIT}`,
        token,
      );
      return items.map((item) => ({
        id: item.id,
        number: item.iid,
        title: item.title,
        url: item.web_url,
        authorLogin: item.author?.username ?? null,
        updatedAt: item.updated_at ?? null,
      }));
    }

    if (provider !== "github" && provider !== "forgejo") {
      return [];
    }

    const [owner, repo] = repository.split("/");
    if (!owner || !repo) {
      return [];
    }

    const items = await fetchGithubJson<GithubIssueOrPr[]>(
      `/repos/${owner}/${repo}/pulls?state=open&per_page=${LIST_LIMIT}`,
      token,
    );

    return items.map((item) => ({
      id: item.id,
      number: item.number,
      title: item.title,
      url:
        item.html_url ||
        constructPullRequestUrl(item.number, provider, repository),
      authorLogin: item.user?.login ?? null,
      updatedAt: item.updated_at ?? null,
    }));
  }

  static async listIssues(
    repository: string,
    provider: Provider,
  ): Promise<GitProviderItem[]> {
    const token = await resolveProviderToken(provider);

    if (provider === "gitlab") {
      const encoded = encodeURIComponent(repository);
      const items = await fetchGitlabJson<GitlabIssue[]>(
        `/projects/${encoded}/issues?state=opened&per_page=${LIST_LIMIT}`,
        token,
      );
      return items.map((item) => ({
        id: item.id,
        number: item.iid,
        title: item.title,
        url: item.web_url,
        authorLogin: item.author?.username ?? null,
        updatedAt: item.updated_at ?? null,
      }));
    }

    if (provider !== "github" && provider !== "forgejo") {
      return [];
    }

    const [owner, repo] = repository.split("/");
    if (!owner || !repo) {
      return [];
    }

    const items = await fetchGithubJson<GithubIssueOrPr[]>(
      `/repos/${owner}/${repo}/issues?state=open&per_page=${LIST_LIMIT}`,
      token,
    );

    // GitHub's issues endpoint also returns pull requests.
    return items
      .filter((item) => !item.pull_request)
      .map((item) => ({
        id: item.id,
        number: item.number,
        title: item.title,
        url:
          item.html_url || constructIssueUrl(item.number, provider, repository),
        authorLogin: item.user?.login ?? null,
        updatedAt: item.updated_at ?? null,
      }));
  }

  static async getPullRequestDetail(
    repository: string,
    provider: Provider,
    number: number,
  ): Promise<PullRequestDetail | null> {
    if (provider !== "github" && provider !== "gitlab") return null;

    const token = await resolveProviderToken(provider);

    if (provider === "gitlab") {
      const encoded = encodeURIComponent(repository);
      const item = await fetchGitlabJson<GitlabMrDetail>(
        `/projects/${encoded}/merge_requests/${number}`,
        token,
      );
      return {
        number: item.iid,
        title: item.title,
        authorLogin: item.author?.username ?? null,
        state: item.state === "opened" ? "open" : "closed",
        mergeable: null,
        additions: null,
        deletions: null,
        changedFiles: item.changes_count ? Number(item.changes_count) : null,
        body: item.description ?? null,
        htmlUrl: item.web_url,
        headRef: item.source_branch ?? null,
        baseRef: item.target_branch ?? null,
        createdAt: item.created_at ?? null,
        updatedAt: item.updated_at ?? null,
      };
    }

    const [owner, repo] = repository.split("/");
    if (!owner || !repo) return null;

    const item = await fetchGithubJson<GithubPullRequestDetail>(
      `/repos/${owner}/${repo}/pulls/${number}`,
      token,
    );
    return {
      number: item.number,
      title: item.title,
      authorLogin: item.user?.login ?? null,
      state: parseGitHubState(item.state, item.merged),
      mergeable: item.mergeable ?? null,
      additions: item.additions,
      deletions: item.deletions,
      changedFiles: item.changed_files,
      body: item.body ?? null,
      htmlUrl: item.html_url,
      headRef: item.head?.ref ?? null,
      baseRef: item.base?.ref ?? null,
      createdAt: item.created_at ?? null,
      updatedAt: item.updated_at ?? null,
    };
  }

  static async getPullRequestCommits(
    repository: string,
    provider: Provider,
    number: number,
  ): Promise<PullRequestCommit[]> {
    if (provider !== "github" && provider !== "gitlab") return [];

    const token = await resolveProviderToken(provider);

    if (provider === "gitlab") {
      const encoded = encodeURIComponent(repository);
      const items = await fetchGitlabJson<GitlabMrCommit[]>(
        `/projects/${encoded}/merge_requests/${number}/commits?per_page=${LIST_LIMIT}`,
        token,
      );
      return items.map((item) => ({
        sha: item.id,
        message: item.message?.split("\n")[0] ?? item.title ?? "",
        authorName: item.author_name ?? null,
        authorLogin: null,
        date: item.created_at ?? null,
      }));
    }

    const [owner, repo] = repository.split("/");
    if (!owner || !repo) return [];

    const items = await fetchGithubJson<GithubPullRequestCommit[]>(
      `/repos/${owner}/${repo}/pulls/${number}/commits?per_page=${LIST_LIMIT}`,
      token,
    );
    return items.map((item) => ({
      sha: item.sha,
      message: item.commit?.message?.split("\n")[0] ?? "",
      authorName: item.commit?.author?.name ?? null,
      authorLogin: item.author?.login ?? null,
      date: item.commit?.author?.date ?? null,
    }));
  }

  static async getPullRequestFiles(
    repository: string,
    provider: Provider,
    number: number,
  ): Promise<PullRequestFile[]> {
    if (provider !== "github" && provider !== "gitlab") return [];

    const token = await resolveProviderToken(provider);

    if (provider === "gitlab") {
      const encoded = encodeURIComponent(repository);
      const response = await fetchGitlabJson<{ changes: GitlabMrChange[] }>(
        `/projects/${encoded}/merge_requests/${number}/changes`,
        token,
      );
      return response.changes.map((change) => {
        const filename = change.new_path || change.old_path;
        const diffLines = change.diff
          .split("\n")
          .filter((line) => line.startsWith("+") || line.startsWith("-"));
        const additions = diffLines.filter(
          (line) => line.startsWith("+") && !line.startsWith("+++"),
        ).length;
        const deletions = diffLines.filter(
          (line) => line.startsWith("-") && !line.startsWith("---"),
        ).length;
        return {
          filename,
          status: change.new_file
            ? "added"
            : change.deleted_file
              ? "removed"
              : change.renamed_file
                ? "renamed"
                : "modified",
          additions,
          deletions,
          changes: additions + deletions,
          patch: change.diff,
        };
      });
    }

    const [owner, repo] = repository.split("/");
    if (!owner || !repo) return [];

    const items = await fetchGithubJson<GithubPullRequestFile[]>(
      `/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`,
      token,
    );
    return items.map((item) => ({
      filename: item.filename,
      status: normalizeFileStatus(item.status),
      additions: item.additions,
      deletions: item.deletions,
      changes: item.changes,
      patch: item.patch ?? null,
    }));
  }

  static async getPullRequestReviewComments(
    repository: string,
    provider: Provider,
    number: number,
  ): Promise<PullRequestReviewComment[]> {
    if (provider !== "github" && provider !== "gitlab") return [];

    const token = await resolveProviderToken(provider);

    if (provider === "gitlab") {
      const encoded = encodeURIComponent(repository);
      const items = await fetchGitlabJson<GitlabMrNote[]>(
        `/projects/${encoded}/merge_requests/${number}/notes?per_page=100`,
        token,
      );
      return items
        .filter((note) => note.position)
        .map((note) => ({
          id: note.id,
          body: note.body,
          path: note.position?.new_path ?? null,
          line: note.position?.new_line ?? null,
          authorLogin: note.author?.username ?? null,
          createdAt: note.created_at ?? null,
        }));
    }

    const [owner, repo] = repository.split("/");
    if (!owner || !repo) return [];

    const items = await fetchGithubJson<GithubPullRequestComment[]>(
      `/repos/${owner}/${repo}/pulls/${number}/comments?per_page=100`,
      token,
    );
    return items.map((item) => ({
      id: item.id,
      body: item.body,
      path: item.path ?? null,
      line: item.line ?? null,
      authorLogin: item.user?.login ?? null,
      createdAt: item.created_at ?? null,
    }));
  }
}
