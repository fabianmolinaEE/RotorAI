import { useState } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Search, Circle } from "lucide-react";
import { getDataService } from "@/data/dataService";
import { useRole } from "@/app/RoleContext";
import { PageShell } from "@/components/page-shell";
import { MessageThread } from "@/components/message-thread";
import { cn } from "@/lib/utils";
import type { MessageThread as MessageThreadType, Role } from "@/data/types";

// ─── Route definition ──────────────────────────────────────────────────────────

export const Route = createFileRoute("/_app/messages/")({
  component: MessagesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    thread: typeof search.thread === "string" ? search.thread : undefined,
    customer: typeof search.customer === "string" ? search.customer : undefined,
    workOrder: typeof search.workOrder === "string" ? search.workOrder : undefined,
  }),
});

// ─── Role-aware contact permissions ───────────────────────────────────────────
// Per locked decision: all roles can message. Thread visibility depends on role.

function roleCanStartDirectMessage(role: Role): boolean {
  // Customers initiate via work-order context threads; internal roles can DM each other
  return role !== "customer";
}

function threadIsVisibleForRole(thread: MessageThreadType, role: Role): boolean {
  if (role === "customer") {
    // Customers only see threads where they are a participant
    return thread.participants.some((p) => p.role === "customer");
  }
  // All internal roles see all threads in the mock (real impl would filter by profile)
  return true;
}

function rolePlaceholderLabel(role: Role): string {
  switch (role) {
    case "owner":
      return "All conversations";
    case "manager":
      return "Team & customer threads";
    case "service_advisor":
      return "Customer & foreman threads";
    case "technician":
      return "Foreman & advisor threads";
    case "customer":
      return "Your shop conversations";
  }
}

// ─── Profile stubs for current user (derived from role) ───────────────────────
// In a real implementation this comes from the auth session.
const PROFILE_BY_ROLE: Record<
  Role,
  { profileId: string; name: string; avatarColor: string }
> = {
  owner: { profileId: "p_owner", name: "Frank Delgado", avatarColor: "oklch(0.62 0.18 245)" },
  manager: { profileId: "p_manager", name: "Sandra Pratt", avatarColor: "oklch(0.65 0.16 160)" },
  service_advisor: { profileId: "p_sa", name: "Carlos Vega", avatarColor: "oklch(0.68 0.17 290)" },
  technician: { profileId: "p_tech", name: "Luis Ortega", avatarColor: "oklch(0.7 0.17 50)" },
  customer: { profileId: "p_customer", name: "Maria Reyes", avatarColor: "oklch(0.65 0.18 330)" },
};

// ─── Thread list sidebar item ──────────────────────────────────────────────────

function ThreadListItem({
  thread,
  isSelected,
  onClick,
}: {
  thread: MessageThreadType;
  isSelected: boolean;
  onClick: () => void;
}) {
  const lastMsg = thread.messages[thread.messages.length - 1];
  const time = lastMsg ? new Date(lastMsg.sentAtIso) : null;
  const timeLabel =
    time && !isNaN(time.getTime())
      ? time.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
      : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-xl px-3 py-3 text-left transition-colors",
        isSelected ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-muted/60",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-sm font-medium">{thread.subject}</span>
            {thread.hasUnread && (
              <Circle className="h-2 w-2 shrink-0 fill-primary text-primary" />
            )}
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-1">
            <span className="truncate text-xs text-muted-foreground">
              {lastMsg ? `${lastMsg.authorName}: ${lastMsg.bodyText.slice(0, 48)}…` : "No messages"}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground/60">{timeLabel}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {thread.participants.slice(0, 3).map((p) => (
              <span
                key={p.profileId}
                className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {p.name.split(" ")[0]}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ role }: { role: Role }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <MessageSquare className="h-7 w-7" />
      </span>
      <div className="mt-4 text-sm font-medium">No conversation selected</div>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {role === "customer"
          ? "Your shop conversations appear here. Contact us about an active work order to get started."
          : "Select a thread from the list to view the conversation, or start a new message."}
      </p>
    </div>
  );
}

// ─── Main page component ───────────────────────────────────────────────────────

function MessagesPage() {
  const { role } = useRole();
  const search = useSearch({ from: "/_app/messages/" });
  const svc = getDataService();
  const queryClient = useQueryClient();

  const { data: allThreads = [], isLoading } = useQuery({
    queryKey: ["messageThreads"],
    queryFn: () => svc.getMessageThreads(),
  });

  // Filter threads by role visibility
  const visibleThreads = allThreads.filter((t) => threadIsVisibleForRole(t, role));

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");
  const filtered = searchQuery.trim()
    ? visibleThreads.filter(
        (t) =>
          t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.participants.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : visibleThreads;

  // Selected thread: from search params or first visible
  const [selectedId, setSelectedId] = useState<string | undefined>(search.thread);
  const activeId = selectedId ?? (search.thread || filtered[0]?.id);
  const activeThread = filtered.find((t) => t.id === activeId) ?? filtered[0];

  // Current user profile
  const me = PROFILE_BY_ROLE[role];

  // sendMessage mutation
  const sendMutation = useMutation({
    mutationFn: (params: {
      threadId: string;
      bodyText: string;
    }) =>
      svc.sendMessage({
        threadId: params.threadId,
        authorProfileId: me.profileId,
        authorName: me.name,
        authorRole: role,
        bodyText: params.bodyText,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messageThreads"] });
    },
  });

  return (
    <PageShell
      title="Messages"
      description={rolePlaceholderLabel(role)}
      actions={
        roleCanStartDirectMessage(role) ? (
          <span className="inline-flex h-9 items-center rounded-lg border bg-muted/50 px-3 text-xs text-muted-foreground">
            + New message (coming soon)
          </span>
        ) : null
      }
    >
      <div className="flex gap-4 h-[calc(100vh-10rem)] min-h-[480px]">
        {/* Thread list */}
        <div className="w-72 shrink-0 flex flex-col gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border bg-muted/40 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Thread items */}
          <div className="flex-1 overflow-y-auto space-y-1">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No conversations found.
              </div>
            ) : (
              filtered.map((thread) => (
                <ThreadListItem
                  key={thread.id}
                  thread={thread}
                  isSelected={thread.id === (activeThread?.id ?? null)}
                  onClick={() => setSelectedId(thread.id)}
                />
              ))
            )}
          </div>

          {/* Role permission note */}
          <div className="rounded-xl border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground/70">
            {role === "customer"
              ? "You can message the shop about any active service."
              : "All staff roles can message customers and each other."}
          </div>
        </div>

        {/* Thread detail */}
        <div className="flex-1 min-w-0">
          {activeThread ? (
            <MessageThread
              thread={activeThread}
              currentProfileId={me.profileId}
              currentRole={role}
              currentName={me.name}
              onSend={(updatedThread) => {
                // Optimistic update feedback — real mutation is handled by sendMessage
                const lastMsg = updatedThread.messages[updatedThread.messages.length - 1];
                if (lastMsg) {
                  sendMutation.mutate({
                    threadId: updatedThread.id,
                    bodyText: lastMsg.bodyText,
                  });
                }
              }}
              className="h-full"
            />
          ) : (
            <EmptyState role={role} />
          )}
        </div>
      </div>
    </PageShell>
  );
}
