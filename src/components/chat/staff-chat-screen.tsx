"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

import { sendStaffMessage } from "@/lib/chat/staff-actions";
import type { ConversationMessage } from "@/lib/chat/conversations";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StaffVoiceCall } from "@/components/voice/staff-voice-call";

type LocalMessage = ConversationMessage & { status?: "sending" | "failed" };

const CLOSED_STATUSES = ["closed", "failed"];

function timeLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string | null;
  sender_type: string;
  message_type: string;
  content: string | null;
  created_at: string;
};

function mapRow(row: MessageRow): LocalMessage {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    senderUserId: row.sender_user_id ? String(row.sender_user_id) : null,
    senderType: row.sender_type as LocalMessage["senderType"],
    messageType: row.message_type as LocalMessage["messageType"],
    content: row.content ? String(row.content) : null,
    createdAt: String(row.created_at),
  };
}

type PendingCall = {
  sessionId: string;
  requestedByName: string;
};

export function StaffChatScreen({
  conversationId,
  businessId,
  businessName,
  customerName,
  initialStatus,
  initialMessages,
}: {
  conversationId: string;
  businessId: string;
  businessName: string;
  customerName: string;
  initialStatus: string;
  initialMessages: ConversationMessage[];
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [status, setStatus] = useState(initialStatus);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [pendingCall, setPendingCall] = useState<PendingCall | null>(null);

  const isClosed = CLOSED_STATUSES.includes(status);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Check for pending voice sessions on mount and periodically
  const checkPendingCalls = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/voice/pending?conversationId=${conversationId}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.sessionId) {
          setPendingCall({
            sessionId: data.sessionId,
            requestedByName: data.requestedByName ?? "Customer",
          });
        } else {
          setPendingCall(null);
        }
      }
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    checkPendingCalls();
    const interval = setInterval(checkPendingCalls, 5000);
    return () => clearInterval(interval);
  }, [checkPendingCalls]);

  // Listen for realtime notifications of voice call requests
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`staff-voice-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (
            row.type === "voice_call_request" &&
            typeof row.data === "object" &&
            row.data !== null
          ) {
            const data = row.data as Record<string, unknown>;
            if (data.conversation_id === conversationId) {
              checkPendingCalls();
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as unknown as MessageRow;
          const inserted = mapRow(row);

          setMessages((current) => {
            if (current.some((message) => message.id === inserted.id)) {
              return current;
            }
            return [
              ...current.filter(
                (message) =>
                  !(
                    message.status === "sending" &&
                    message.content === inserted.content
                  ),
              ),
              inserted,
            ];
          });

          // If a voice-related system message arrived, re-check pending calls
          if (
            inserted.senderType === "system" &&
            inserted.content?.includes("📞")
          ) {
            checkPendingCalls();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (typeof row.status === "string") {
            setStatus(row.status);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, checkPendingCalls]);

  const refreshMessages = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_user_id, sender_type, message_type, content, created_at",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return;
    }

    setMessages(data.map(mapRow));
  }, [conversationId]);

  const handleSend = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || sending || isClosed) {
        return;
      }

      setMessages((current) => [
        ...current,
        {
          id: `temp-${crypto.randomUUID()}`,
          conversationId,
          senderUserId: null,
          senderType: "business_staff",
          messageType: "text",
          content: trimmed,
          createdAt: new Date().toISOString(),
          status: "sending",
        },
      ]);
      setInput("");
      setSending(true);

      const result = await sendStaffMessage(conversationId, { content: trimmed });
      setSending(false);

      if (result.error) {
        setMessages((current) =>
          current.map((message) =>
            message.id.startsWith("temp-") &&
            message.content === trimmed &&
            message.senderType === "business_staff"
              ? { ...message, status: "failed" }
              : message,
          ),
        );
        toast.error(result.error);
        return;
      }

      setStatus("human_connected");
      await refreshMessages();
    },
    [conversationId, sending, isClosed, refreshMessages],
  );

  const handleRetry = useCallback(
    (content: string) => {
      void handleSend(content);
    },
    [handleSend],
  );

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/dashboard/${businessId}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-semibold tracking-tight">
              {customerName}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {businessName}
            </p>
          </div>
        </div>

        {isClosed ? (
          <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Ended
          </span>
        ) : status === "human_connected" ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-green-600" aria-hidden />
            You&apos;re connected
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            {status === "human_requested" ? "Waiting to connect" : "AI handling"}
          </span>
        )}
      </header>

      {/* Voice call notification */}
      {pendingCall && (
        <div className="mt-4">
          <StaffVoiceCall
            conversationId={conversationId}
            sessionId={pendingCall.sessionId}
            requestedByName={pendingCall.requestedByName}
            onEnd={() => {
              setPendingCall(null);
              refreshMessages();
            }}
          />
        </div>
      )}

      <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-background p-4">
        {messages.map((message) => {
          if (message.senderType === "system") {
            return (
              <p
                key={message.id}
                className="mx-auto max-w-sm text-center text-xs text-muted-foreground"
              >
                {message.content}
              </p>
            );
          }

          const fromStaff = message.senderType === "business_staff";

          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                fromStaff ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                  fromStaff
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-2 text-[11px]",
                    fromStaff
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  <span>
                    {message.senderType === "ai_agent" ? "AI · " : ""}
                    {timeLabel(message.createdAt)}
                  </span>
                  {message.status === "sending" && <span>Sending…</span>}
                  {message.status === "failed" && (
                    <button
                      type="button"
                      onClick={() => handleRetry(message.content ?? "")}
                      className="font-medium underline underline-offset-2"
                    >
                      Failed · Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {isClosed ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold">Conversation closed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This conversation has ended.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend(input);
          }}
          className="mt-4 flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={`Reply as ${businessName}…`}
            aria-label="Reply"
            maxLength={2000}
            disabled={sending}
            className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <Button
            type="submit"
            size="icon"
            className="size-11 shrink-0"
            disabled={!input.trim() || sending}
            aria-label="Send reply"
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </form>
      )}
    </div>
  );
}
