import { GitControlBar } from "../chat/git-control-bar";

/**
 * Repo + branch chips for the conversation header.
 *
 * The old git control bar used to sit below the chat input with pull / push /
 * PR actions. Those actions moved to the header's git-actions menu and the
 * chat-input tools menu (agent-prompt driven); this header badge shows only
 * the read-only repo / branch chips plus the "connect repo" trigger (cloud).
 *
 * Bounded width so a long repo name truncates instead of crowding the
 * conversation name or the header toggle buttons.
 */
export function ConversationGitBadges() {
  return (
    <div
      data-testid="conversation-git-badges"
      className="hidden min-w-0 max-w-[300px] shrink items-center gap-2 pl-2 pr-1.5 md:flex"
    >
      <GitControlBar />
    </div>
  );
}
