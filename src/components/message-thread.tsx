import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, MessageThread as MessageThreadType, Role } from "@/data/types";

// ─── Role permission helper ────────────────────────────────────────────────────
// All roles can message; thread visibility is controlled at the route level.

function roleLabel(role: Role): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "service_advisor":
      return "Service Advisor";
    case "technician":
      return "Technician";
    case "customer":
      return "Customer";
  }
}

function roleAccentClass(role: Role): string {
  switch (role) {
    case "owner":
      return "bg-purple-500/12 text-purple-700 dark:text-purple-300";
    case "manager":
      return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";
    case "service_advisor":
      return "bg-sky-500/12 text-sky-700 dark:text-sky-300";
    case "technician":
      return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
    case "customer":
      return "bg-rose-500/12 text-rose-700 dark:text-rose-300";
  }
}

// ─── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isCurrentUser,
}: {
  message: Message;
  isCurrentUser: boolean;
}) {
  const time = new Date(message.sentAtIso);
  const timeLabel = isNaN(time.getTime())
    ? ""
    : time.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[80%]",
        isCurrentUser ? "ml-auto flex-row-reverse" : "mr-auto flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
          roleAccentClass(message.authorRole),
        )}
        title={`${message.authorName} (${roleLabel(message.authorRole)})`}
      >
        {message.authorName.charAt(0)}
      </div>

      {/* Bubble */}
      <div className="space-y-1">
        {/* Name + role badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs text-muted-foreground",
            isCurrentUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-medium">{message.authorName}</span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] leading-tight">
            {roleLabel(message.authorRole)}
          </span>
          {message.aiDrafted && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] leading-tight text-violet-600 dark:text-violet-400"
              title="This message was drafted with AI assistance"
            >
              <Bot className="h-2.5 w-2.5" />
              AI-drafted
            </span>
          )}
        </div>

        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            isCurrentUser
              ? "rounded-tr-sm bg-primary text-primary-foreground"
              : "rounded-tl-sm bg-muted",
          )}
        >
          {message.bodyText}
        </div>

        <div
          className={cn(
            "flex items-center gap-1 text-[10px] text-muted-foreground/60",
            isCurrentUser ? "justify-end" : "justify-start",
          )}
        >
          {timeLabel}
          {isCurrentUser && <CheckCheck className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}

// ─── AI Draft affordance ───────────────────────────────────────────────────────

function AiDraftBanner({ onInsert }: { onInsert: (text: string) => void }) {
  const DEMO_DRAFT =
    "Thank you for reaching out! I wanted to give you a quick update on your vehicle. Our technician has completed the initial inspection and we are making good progress. We will have more details for you shortly and will follow up as soon as we have an ETA confirmed.";

  return (
    <div className="flex items-start gap-2 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-violet-500/12 text-violet-600 dark:text-violet-400">
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
            AI Draft
          </span>
          <span className="rounded-full bg-violet-500/12 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
            Coming Soon
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          AI drafting will generate a context-aware reply based on the work order, customer history, and conversation. Review and edit before sending.
        </p>
        <button
          type="button"
          onClick={() => onInsert(DEMO_DRAFT)}
          className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-lg border border-violet-500/30 bg-background px-2.5 text-xs font-medium text-violet-700 hover:bg-violet-500/5 dark:text-violet-300"
        >
          <Sparkles className="h-3 w-3" />
          Insert demo draft
        </button>
      </div>
    </div>
  );
}

// ─── Notification preferences display ─────────────────────────────────────────

function NotificationPrefsRow({ channels }: { channels: string[] }) {
  const labels: Record<string, string> = {
    in_app: "In-app",
    email: "Email",
    sms: "SMS",
  };
  const all = ["in_app", "email", "sms"];
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground">Notifications:</span>
      {all.map((ch) => (
        <span
          key={ch}
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-medium",
            channels.includes(ch)
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground/40 line-through",
          )}
          title={channels.includes(ch) ? `${labels[ch]} enabled` : `${labels[ch]} disabled`}
        >
          {labels[ch]}
        </span>
      ))}
      <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground/60">
        placeholder
      </span>
    </div>
  );
}

// ─── Main MessageThread component ─────────────────────────────────────────────

export interface MessageThreadProps {
  thread: MessageThreadType;
  currentProfileId: string;
  currentRole: Role;
  currentName: string;
  onSend?: (thread: MessageThreadType) => void;
  className?: string;
}

export function MessageThread({
  thread,
  currentProfileId,
  currentRole,
  currentName,
  onSend,
  className,
}: MessageThreadProps) {
  const [draft, setDraft] = useState("");
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [messages, setMessages] = useState<Message[]>(thread.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const body = draft.trim();
    if (!body) return;
    const newMsg: Message = {
      id: `msg_local_${Date.now()}`,
      threadId: thread.id,
      authorProfileId: currentProfileId,
      authorName: currentName,
      authorRole: currentRole,
      bodyText: body,
      sentAtIso: new Date().toISOString(),
      aiDrafted: false,
    };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setDraft("");
    setShowAiDraft(false);
    onSend?.({ ...thread, messages: updated });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  // Current user notification prefs (from thread participants)
  const myParticipant = thread.participants.find((p) => p.profileId === currentProfileId);

  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card", className)}>
      {/* Thread header */}
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{thread.subject}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {thread.participants.map((p) => (
              <span
                key={p.profileId}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  roleAccentClass(p.role),
                )}
              >
                <span
                  className="grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] font-bold"
                  style={{ background: p.avatarColor, color: "white" }}
                >
                  {p.name.charAt(0)}
                </span>
                {p.name}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-[10px] text-muted-foreground/60 mt-1">
          {thread.type === "work_order" ? "Work order thread" : "Direct message"}
        </div>
      </div>

      {/* Notification prefs (placeholder) */}
      {myParticipant && (
        <div className="border-b px-4 py-2">
          <NotificationPrefsRow channels={myParticipant.notificationPrefs.channels} />
        </div>
      )}

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[200px] max-h-[400px]">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={msg.authorProfileId === currentProfileId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose area */}
      <div className="border-t px-4 py-3 space-y-2">
        {showAiDraft && (
          <AiDraftBanner
            onInsert={(text) => {
              setDraft(text);
              setShowAiDraft(false);
            }}
          />
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message… (Ctrl+Enter to send)"
            rows={2}
            className="flex-1 resize-none rounded-xl border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50"
          />
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              title="AI Draft (Coming Soon)"
              onClick={() => setShowAiDraft((v) => !v)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg border text-sm transition-colors",
                showAiDraft
                  ? "border-violet-500/40 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                  : "bg-muted/50 text-muted-foreground hover:text-foreground",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim()}
              className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground/50">
          Ctrl+Enter to send · AI draft available to all roles (coming soon)
        </div>
      </div>
    </div>
  );
}
