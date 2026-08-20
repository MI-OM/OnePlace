import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";

export type BusinessAnalytics = {
  totalConversations: number;
  openConversations: number;
  conversationsThisWeek: number;
  conversationsThisMonth: number;
  totalRequests: number;
  openRequests: number;
  completedRequests: number;
  requestCompletionRate: number | null;
  totalReviews: number;
  averageRating: number | null;
  reviewsThisMonth: number;
  ratingDistribution: Record<number, number>;
  totalVoiceCalls: number;
  completedVoiceCalls: number;
  avgVoiceDuration: number | null;
  totalMessages: number;
  messagesThisWeek: number;
  avgMessagesPerConversation: number | null;
  dailyActivity: { date: string; conversations: number; messages: number; requests: number }[];
};

export async function getBusinessAnalytics(
  businessId: string,
): Promise<BusinessAnalytics | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("business_members")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!member) return null;

  const service = createServiceClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Core counts
  const [conversationsResult, requestsResult, reviewsResult] = await Promise.all([
    service
      .from("conversations")
      .select("id, status, created_at")
      .eq("business_id", businessId),
    service
      .from("service_requests")
      .select("id, status")
      .eq("business_id", businessId),
    service
      .from("reviews")
      .select("id, rating, created_at")
      .eq("business_id", businessId)
      .eq("status", "published"),
  ]);

  const allConversations = conversationsResult.data ?? [];
  const convIds = allConversations.map((c) => c.id);
  const allRequests = requestsResult.data ?? [];
  const allReviews = reviewsResult.data ?? [];

  // Derived counts
  const openConversations = allConversations.filter(
    (c) => c.status !== "closed" && c.status !== "failed",
  ).length;
  const conversationsThisWeek = allConversations.filter(
    (c) => new Date(c.created_at) >= weekAgo,
  ).length;
  const conversationsThisMonth = allConversations.filter(
    (c) => new Date(c.created_at) >= monthStart,
  ).length;
  const openRequests = allRequests.filter(
    (r) => r.status === "open" || r.status === "pending",
  ).length;
  const completedRequests = allRequests.filter(
    (r) => r.status === "completed" || r.status === "resolved",
  ).length;
  const requestCompletionRate =
    allRequests.length > 0 ? Math.round((completedRequests / allRequests.length) * 100) : null;

  const totalReviews = allReviews.length;
  const averageRating =
    totalReviews > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews) * 10) / 10
      : null;
  const reviewsThisMonth = allReviews.filter(
    (r) => new Date(r.created_at) >= monthStart,
  ).length;
  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of allReviews) {
    const rating = Math.round(r.rating ?? 0);
    if (rating >= 1 && rating <= 5) ratingDistribution[rating]++;
  }

  // Messages and voice (need conversation IDs)
  let totalMessages = 0;
  let messagesThisWeek = 0;
  let voiceSessions: { status: string; duration_seconds: number | null }[] = [];

  if (convIds.length > 0) {
    const chunks: string[][] = [];
    for (let i = 0; i < convIds.length; i += 50) chunks.push(convIds.slice(i, i + 50));

    const [msgAllResults, msgWeekResults, voiceResults] = await Promise.all([
      Promise.all(
        chunks.map((chunk) =>
          service
            .from("messages")
            .select("id, created_at")
            .in("conversation_id", chunk),
        ),
      ),
      Promise.all(
        chunks.map((chunk) =>
          service
            .from("messages")
            .select("id, created_at")
            .in("conversation_id", chunk)
            .gte("created_at", weekAgo.toISOString()),
        ),
      ),
      Promise.all(
        chunks.map((chunk) =>
          service
            .from("voice_sessions")
            .select("id, status, duration_seconds")
            .in("conversation_id", chunk),
        ),
      ),
    ]);

    const allMsgs = msgAllResults.flatMap((r) => r.data ?? []);
    totalMessages = allMsgs.length;
    messagesThisWeek = msgWeekResults.flatMap((r) => r.data ?? []).length;
    voiceSessions = voiceResults.flatMap((r) => r.data ?? []);
  }

  const avgMessagesPerConversation =
    allConversations.length > 0
      ? Math.round((totalMessages / allConversations.length) * 10) / 10
      : null;

  const completedVoice = voiceSessions.filter(
    (v) => v.status === "active" || v.status === "ended",
  );
  const avgVoiceDuration =
    completedVoice.length > 0
      ? Math.round(
          completedVoice.reduce((sum, v) => sum + (v.duration_seconds ?? 0), 0) / completedVoice.length,
        )
      : null;

  // Daily activity (last 7 days)
  const dailyMap = new Map<string, { conversations: number; messages: number; requests: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dailyMap.set(d.toISOString().split("T")[0], { conversations: 0, messages: 0, requests: 0 });
  }

  for (const c of allConversations) {
    const key = c.created_at?.split("T")[0];
    if (key && dailyMap.has(key)) dailyMap.get(key)!.conversations++;
  }

  if (convIds.length > 0) {
    const chunks: string[][] = [];
    for (let i = 0; i < convIds.length; i += 50) chunks.push(convIds.slice(i, i + 50));
    const weekMsgs = await Promise.all(
      chunks.map((chunk) =>
        service
          .from("messages")
          .select("id, created_at")
          .in("conversation_id", chunk)
          .gte("created_at", weekAgo.toISOString()),
      ),
    );
    for (const m of weekMsgs.flatMap((r) => r.data ?? [])) {
      const key = m.created_at?.split("T")[0];
      if (key && dailyMap.has(key)) dailyMap.get(key)!.messages++;
    }
  }

  const dailyActivity = Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return {
    totalConversations: allConversations.length,
    openConversations,
    conversationsThisWeek,
    conversationsThisMonth,
    totalRequests: allRequests.length,
    openRequests,
    completedRequests,
    requestCompletionRate,
    totalReviews,
    averageRating,
    reviewsThisMonth,
    ratingDistribution,
    totalVoiceCalls: voiceSessions.length,
    completedVoiceCalls: completedVoice.length,
    avgVoiceDuration,
    totalMessages,
    messagesThisWeek,
    avgMessagesPerConversation,
    dailyActivity,
  };
}
