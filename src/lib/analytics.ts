import { createServiceClient } from "@/lib/supabase/service";

/**
 * Lightweight analytics instrumentation (L5). Writes to the analytics_events
 * table which is append-only. No PII is recorded — only business and event
 * identifiers.
 */
export async function trackEvent(params: {
  eventName: string;
  eventCategory?: string;
  userId?: string;
  businessId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  try {
    const service = createServiceClient();
    await service.from("analytics_events").insert({
      event_name: params.eventName,
      event_category: params.eventCategory ?? null,
      user_id: params.userId ?? null,
      business_id: params.businessId ?? null,
      session_id: params.sessionId ?? null,
      properties: params.properties ?? {},
    });
  } catch {
    // Analytics failures must never block user actions
  }
}

// Convenience helpers for common events

export const analytics = {
  // Discovery
  searchPerformed: (query: string, resultCount: number) =>
    trackEvent({
      eventName: "search.performed",
      eventCategory: "discovery",
      properties: { query, resultCount },
    }),

  businessViewed: (businessId: string, userId?: string) =>
    trackEvent({
      eventName: "business.viewed",
      eventCategory: "discovery",
      businessId,
      userId,
    }),

  businessFavorited: (businessId: string, userId: string) =>
    trackEvent({
      eventName: "business.favorited",
      eventCategory: "engagement",
      businessId,
      userId,
    }),

  businessUnfavorited: (businessId: string, userId: string) =>
    trackEvent({
      eventName: "business.unfavorited",
      eventCategory: "engagement",
      businessId,
      userId,
    }),

  // Conversation
  conversationStarted: (conversationId: string, businessId: string, userId: string) =>
    trackEvent({
      eventName: "conversation.started",
      eventCategory: "conversation",
      businessId,
      userId,
      properties: { conversationId },
    }),

  humanHandoffRequested: (conversationId: string, businessId: string) =>
    trackEvent({
      eventName: "conversation.handoff_requested",
      eventCategory: "conversation",
      businessId,
      properties: { conversationId },
    }),

  // Request
  requestCreated: (requestId: string, businessId: string, requestType: string) =>
    trackEvent({
      eventName: "request.created",
      eventCategory: "request",
      businessId,
      properties: { requestId, requestType },
    }),

  // Voice
  voiceSessionStarted: (sessionId: string, businessId: string, userId: string) =>
    trackEvent({
      eventName: "voice.session_started",
      eventCategory: "voice",
      businessId,
      userId,
      properties: { sessionId },
    }),

  voiceSessionEnded: (sessionId: string, durationSeconds: number) =>
    trackEvent({
      eventName: "voice.session_ended",
      eventCategory: "voice",
      properties: { sessionId, durationSeconds },
    }),

  // Onboarding
  businessCreated: (businessId: string, userId: string) =>
    trackEvent({
      eventName: "onboarding.business_created",
      eventCategory: "onboarding",
      businessId,
      userId,
    }),
};
