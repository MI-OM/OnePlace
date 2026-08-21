"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { playNotification } from "@/lib/sounds";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  // Initial load + polling
  useEffect(() => {
    let active = true;

    async function fetchNotifications() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;

      const { data } = await supabase
        .from("notifications")
        .select("id, type, title, body, data, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && active) {
        setNotifications(
          data.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            data: n.data,
            readAt: n.read_at,
            createdAt: n.created_at,
          })),
        );
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // Listen for realtime notifications
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        async () => {
          playNotification();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) return;
          const { data } = await supabase
            .from("notifications")
            .select("id, type, title, body, data, read_at, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20);
          if (data) {
            setNotifications(
              data.map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                body: n.body,
                data: n.data,
                readAt: n.read_at,
                createdAt: n.created_at,
              })),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    const supabase = createClient();
    const unread = notifications.filter((n) => !n.readAt);
    for (const n of unread) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", n.id);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
    );
  }, [notifications]);

  const getLink = (n: Notification): string | null => {
    if (n.type === "human_handoff" || n.type === "request_status_change") {
      const businessId = n.data.businessId as string | undefined;
      if (businessId) return `/dashboard/${businessId}`;
    }
    if (n.type === "new_message" || n.type === "voice_call_request") {
      const businessId = n.data.businessId as string | undefined;
      const conversationId = n.data.conversationId as string | undefined;
      if (businessId && conversationId) return `/conversations/${conversationId}`;
      if (businessId) return `/dashboard/${businessId}`;
    }
    return null;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="size-4" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <span className="text-sm font-medium">Notifications</span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((n) => {
                  const link = getLink(n);
                  const content = (
                    <div
                      key={n.id}
                      className={`border-b border-border px-4 py-3 ${
                        !n.readAt ? "bg-primary/5" : ""
                      }`}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {n.body}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  );

                  if (link) {
                    return (
                      <Link
                        key={n.id}
                        href={link}
                        onClick={() => {
                          markAsRead(n.id);
                          setOpen(false);
                        }}
                        className="block hover:bg-muted/50"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      {content}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
