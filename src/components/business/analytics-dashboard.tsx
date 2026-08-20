"use client";

import {
  MessageSquare,
  ClipboardList,
  Star,
  Phone,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import type { BusinessAnalytics } from "@/lib/business/analytics";

type Props = {
  analytics: BusinessAnalytics;
};

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-muted-foreground">{star}</span>
      <Star className="size-3 text-amber-500" aria-hidden />
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-muted-foreground">{count}</span>
    </div>
  );
}

function MiniChart({ data }: { data: { date: string; conversations: number; messages: number; requests: number }[] }) {
  const max = Math.max(...data.map((d) => d.messages), 1);

  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d) => {
        const msgHeight = (d.messages / max) * 100;
        const convHeight = (d.conversations / max) * 100;
        const dayLabel = new Date(d.date + "T12:00:00Z").toLocaleDateString("default", { weekday: "short" });

        return (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end justify-center gap-0.5" style={{ height: "100px" }}>
              <div
                className="w-2 rounded-t bg-primary/40"
                style={{ height: `${Math.max(convHeight, 2)}%` }}
                title={`${d.conversations} conversations`}
              />
              <div
                className="w-2 rounded-t bg-primary"
                style={{ height: `${Math.max(msgHeight, 2)}%` }}
                title={`${d.messages} messages`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsDashboard({ analytics }: Props) {
  const a = analytics;

  return (
    <div className="mt-8 space-y-6">
      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<MessageSquare className="size-4" aria-hidden />}
          label="Conversations"
          value={a.totalConversations}
          sub={`${a.openConversations} open · ${a.conversationsThisWeek} this week`}
        />
        <StatCard
          icon={<ClipboardList className="size-4" aria-hidden />}
          label="Requests"
          value={a.totalRequests}
          sub={`${a.openRequests} open · ${a.completedRequests} completed`}
        />
        <StatCard
          icon={<Star className="size-4" aria-hidden />}
          label="Reviews"
          value={a.totalReviews}
          sub={
            a.averageRating !== null
              ? `${a.averageRating} avg · ${a.reviewsThisMonth} this month`
              : "No reviews yet"
          }
        />
        <StatCard
          icon={<MessageCircle className="size-4" aria-hidden />}
          label="Messages"
          value={a.totalMessages}
          sub={`${a.messagesThisWeek} this week · ${a.avgMessagesPerConversation ?? 0} avg/convo`}
        />
      </div>

      {/* Row 2: Voice + Request completion */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Phone className="size-4" aria-hidden />}
          label="Voice calls"
          value={a.totalVoiceCalls}
          sub={`${a.completedVoiceCalls} connected · ${formatDuration(a.avgVoiceDuration)} avg`}
        />
        <StatCard
          icon={<CheckCircle className="size-4" aria-hidden />}
          label="Request completion"
          value={a.requestCompletionRate !== null ? `${a.requestCompletionRate}%` : "—"}
          sub={`${a.completedRequests} of ${a.totalRequests} requests`}
        />
        <StatCard
          icon={<TrendingUp className="size-4" aria-hidden />}
          label="This month"
          value={a.conversationsThisMonth}
          sub="new conversations"
        />
      </div>

      {/* Row 3: Activity chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="size-4 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-medium">Activity — Last 7 days</h2>
        </div>
        <MiniChart data={a.dailyActivity} />
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-primary/40" />
            Conversations
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-primary" />
            Messages
          </span>
        </div>
      </div>

      {/* Row 4: Rating distribution */}
      {a.totalReviews > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-medium">Rating distribution</h2>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => (
              <RatingBar
                key={star}
                star={star}
                count={a.ratingDistribution[star] ?? 0}
                total={a.totalReviews}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
