import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Patterns of files/folders the user wants hidden from the workspace file
 * tree, the files-tab search and the Ctrl+P file switcher. Persisted to
 * localStorage (same `zustand/persist` pattern as the other UI stores).
 * Editing the patterns bumps the store, which the workspace-files query key
 * includes — so the tree/search refetch automatically.
 *
 * See {@link patternMatchesPath} in `#/utils/workspace-ignore` for the
 * matching rules.
 */
interface WorkspaceIgnoreState {
  patterns: string[];
  setPatterns: (patterns: string[]) => void;
}

export const useWorkspaceIgnoreStore = create<WorkspaceIgnoreState>()(
  persist(
    (set) => ({
      patterns: [],
      setPatterns: (patterns) =>
        set(() => ({
          patterns: [
            ...new Set(
              patterns.map((pattern) => pattern.trim()).filter(Boolean),
            ),
          ],
        })),
    }),
    {
      name: "openhands-workspace-ignore",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
