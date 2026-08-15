"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Mic, Send } from "lucide-react";

import {
  closeConversation,
  requestHuman,
  sendMessage,
} from "@/lib/chat/actions";
import type { ConversationMessage } from "@/lib/chat/conversations";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type LocalMessage = ConversationMessage & { status?: "sending" | "failed" };

const CLOSED_STATUSES = ["closed", "failed"];

function timeLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChatScreen({
  conversationId,
  businessName,
  businessSlug,
  initialStatus,
  initialMessages,
}: {
  conversationId: string;
  businessName: string;
  businessSlug: string;
  initialStatus: string;
  initialMessages: ConversationMessage[];
}) {
  const [messages, setMessages] = useState<LocalMessage[]>(initialMessages);
  const [status, setStatus] = useState(initialStatus);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isClosed = CLOSED_STATUSES.includes(status);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiThinking, scrollToBottom]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const inserted: LocalMessage = {
            id: String(row.id),
            conversationId: String(row.conversation_id),
            senderUserId: row.sender_user_id ? String(row.sender_user_id) : null,
            senderType: row.sender_type as LocalMessage["senderType"],
            messageType: row.message_type as LocalMessage["messageType"],
            content: row.content ? String(row.content) : null,
            createdAt: String(row.created_at),
          };

          setMessages((current) => {
            if (current.some((message) => message.id === inserted.id)) {
              return current;
            }

            if (inserted.senderType === "customer") {
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
            }

            if (inserted.senderType === "ai_agent" || inserted.senderType === "system") {
              setAiThinking(false);
            }

            return [...current, inserted];
          });
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
          senderType: "customer",
          messageType: "text",
          content: trimmed,
          createdAt: new Date().toISOString(),
          status: "sending",
        },
      ]);
      setInput("");
      setSending(true);
      setAiThinking(true);

      const result = await sendMessage(conversationId, { content: trimmed });
      setSending(false);

      if (result.error) {
        setAiThinking(false);
        setMessages((current) =>
          current.map((message) =>
            message.id.startsWith("temp-") &&
            message.content === trimmed &&
            message.senderType === "customer"
              ? { ...message, status: "failed" }
              : message,
          ),
        );
        toast.error(result.error);
      }
    },
    [conversationId, sending, isClosed],
  );

  const handleRetry = useCallback(
    (content: string) => {
      setMessages((current) =>
        current.filter(
          (message) =>
            !(
              message.id.startsWith("temp-") &&
              message.content === content &&
              message.senderType === "customer"
            ),
        ),
      );
      void handleSend(content);
    },
    [handleSend],
  );

  const handleRequestHuman = useCallback(async () => {
    const result = await requestHuman(conversationId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setStatus("human_requested");
    toast.success("We've let the team know.");
  }, [conversationId]);

  const handleClose = useCallback(async () => {
    const confirmed = window.confirm(
      "End this conversation?\nYou can always start a new conversation with this business later.",
    );
    if (!confirmed) {
      return;
    }

    const result = await closeConversation(conversationId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setStatus("closed");
  }, [conversationId]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/businesses/${businessSlug}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Back to business"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-semibold tracking-tight">
              {businessName}
            </h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Bot className="size-3" aria-hidden />
              AI assistant
            </p>
          </div>
        </div>

        {status === "human_requested" ? (
          <span className="inline-flex shrink-0 items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            Waiting for team
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-green-600" aria-hidden />
            Online
          </span>
        )}
      </header>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        You&apos;re chatting with an AI assistant.
      </p>

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

          const fromCustomer = message.senderType === "customer";

          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                fromCustomer ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                  fromCustomer
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div
                  className={cn(
                    "mt-1 flex items-center gap-2 text-[11px]",
                    fromCustomer
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  <span>{timeLabel(message.createdAt)}</span>
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

        {aiThinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {isClosed ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold">Conversation closed</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This conversation has ended. If you need anything else, you can
            start a new conversation.
          </p>
          <Button
            className="mt-4"
            render={<Link href={`/businesses/${businessSlug}`} />}
          >
            Done
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask anything…"
              aria-label="Message"
              maxLength={2000}
              disabled={sending}
              className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <Button
              type="submit"
              size="icon"
              className="size-11 shrink-0"
              disabled={!input.trim() || sending}
              aria-label="Send message"
            >
              <Send className="size-4" aria-hidden />
            </Button>
          </form>

          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={handleRequestHuman}
              disabled={status === "human_requested"}
              className="rounded-lg px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Talk to a person
            </button>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Mic className="size-3.5" aria-hidden />
                Voice coming soon
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted"
              >
                End conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
