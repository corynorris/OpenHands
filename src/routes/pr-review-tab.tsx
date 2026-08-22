import { ChangesReview } from "#/components/features/pr-review/changes-review";

/**
 * Conversation right-drawer tab route: local working-tree "Changes" review
 * (GitHub-style changed-files list with lazy per-file unified diffs).
 * Backed by local git plumbing — no provider connection required.
 */
export default function PrReviewTabRoute() {
  return <ChangesReview />;
}
