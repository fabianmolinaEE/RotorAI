/**
 * DiagnosticReviewPanel — read-only summary of selected diagnostics and
 * advisor notes for a concern that has been drafted or reviewed.
 *
 * Used to surface diagnostic context in the foreman delegation queue and
 * in the work order detail view when the job was created from a concern.
 */
import { Sparkles, CheckCircle2, StickyNote } from "lucide-react";
import type { AiDiagnosticSuggestion } from "@/data/types";

export interface DiagnosticReviewPanelProps {
  /** All AI suggestions defined for the concern */
  suggestions: AiDiagnosticSuggestion[];
  /** IDs of suggestions the SA selected */
  selectedIds: string[];
  /** SA's free-text diagnostic notes */
  advisorNotes?: string;
}

export function DiagnosticReviewPanel({
  suggestions,
  selectedIds,
  advisorNotes,
}: DiagnosticReviewPanelProps) {
  const selected = suggestions.filter((s) => selectedIds.includes(s.id));
  const hasContent = selected.length > 0 || !!advisorNotes;

  if (!hasContent) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        No diagnostic notes recorded.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Selected AI diagnostics
            </span>
          </div>
          <ul className="space-y-1.5">
            {selected.map((s) => (
              <li
                key={s.id}
                className="flex items-start gap-2 rounded-md border bg-card px-3 py-2"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {advisorNotes && (
        <div>
          <div className="mb-1.5 flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Advisor notes
            </span>
          </div>
          <div className="rounded-md border bg-card px-3 py-2 text-sm">{advisorNotes}</div>
        </div>
      )}
    </div>
  );
}
