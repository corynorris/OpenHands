import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

/**
 * Compact GitHub-style renderer for a single unified diff (`patch` string).
 * No Monaco / syntax highlighting — just hunks with old/new line numbers and
 * +/-/context colouring, plus dimmed meta lines for the diff headers.
 */

interface PatchLine {
  kind: "meta" | "hunk" | "context" | "add" | "del";
  oldLine: number | null;
  newLine: number | null;
  content: string;
}

export function parsePatch(patch: string | null | undefined): PatchLine[] {
  if (!patch) return [];

  const lines: PatchLine[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const raw of patch.split("\n")) {
    const content = raw.length > 0 ? raw.slice(1) : "";

    if (raw.startsWith("@@")) {
      lines.push({ kind: "hunk", oldLine: null, newLine: null, content: raw });
      const match = /-(\d+)(?:,\d+)? \+(\d+)/.exec(raw);
      if (match) {
        oldLine = Number(match[1]) - 1;
        newLine = Number(match[2]) - 1;
      }
      continue;
    }

    if (raw.startsWith("+") && !raw.startsWith("+++")) {
      newLine += 1;
      lines.push({ kind: "add", oldLine: null, newLine, content });
      continue;
    }

    if (raw.startsWith("-") && !raw.startsWith("---")) {
      oldLine += 1;
      lines.push({ kind: "del", oldLine, newLine: null, content });
      continue;
    }

    if (raw.startsWith(" ")) {
      oldLine += 1;
      newLine += 1;
      lines.push({ kind: "context", oldLine, newLine, content });
      continue;
    }

    // Everything else: "diff --git", "index", "---", "+++", "\\ No newline…"
    lines.push({ kind: "meta", oldLine: null, newLine: null, content: raw });
  }

  return lines;
}

const LINE_COLUMN_WIDTH = "w-10";

/** Diff glyph for a line kind — kept at module scope (outside JSX). */
function diffGlyph(kind: PatchLine["kind"]): string {
  switch (kind) {
    case "add":
      return "+";
    case "del":
      return "-";
    case "hunk":
      return "@";
    default:
      return "";
  }
}

/** Row colouring per diff-line kind (module scope, outside JSX). */
function rowClassFor(kind: PatchLine["kind"]): string {
  switch (kind) {
    case "add":
      return "bg-emerald-500/10 text-emerald-300";
    case "del":
      return "bg-red-500/10 text-red-300";
    case "hunk":
      return "bg-[var(--oh-surface-raised)] text-[var(--oh-text-secondary)]";
    case "meta":
      return "text-[var(--oh-text-dim)]";
    default:
      return "text-[var(--oh-text-tertiary)]";
  }
}

export function PrPatchView({ patch }: { patch: string | null | undefined }) {
  const { t } = useTranslation("openhands");
  const lines = useMemo(() => parsePatch(patch), [patch]);

  if (!patch) {
    return (
      <div className="px-3 py-3 text-xs text-[var(--oh-muted)]">
        {t(I18nKey.PR$NO_DIFF)}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto custom-scrollbar-always">
      <table className="w-full min-w-full border-collapse font-mono text-[11px] leading-5">
        <tbody>
          {lines.map((line, index) => {
            const rowClass = rowClassFor(line.kind);

            return (
              <tr key={index} className={rowClass}>
                <td
                  className={cn(
                    "select-none border-r border-[var(--oh-border-subtle)] pr-2 text-right tabular-nums text-[var(--oh-text-dim)]",
                    LINE_COLUMN_WIDTH,
                  )}
                >
                  {line.oldLine ?? ""}
                </td>
                <td
                  className={cn(
                    "select-none pr-2 text-right tabular-nums text-[var(--oh-text-dim)]",
                    LINE_COLUMN_WIDTH,
                  )}
                >
                  {line.newLine ?? ""}
                </td>
                <td className="select-none px-2 text-[var(--oh-text-dim)]">
                  {diffGlyph(line.kind)}
                </td>
                <td className="whitespace-pre px-0 text-inherit">
                  {line.content || " "}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
