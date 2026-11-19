import type Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe, isStripeConfigured } from "@/lib/payments/stripe";
import {
  applyAccountState,
  applyChargeRefunded,
  applyCheckoutSession,
} from "@/lib/payments/core";
import { logger } from "@/lib/logger";

/**
 * POST /api/stripe/webhook
 *
 * Configure in Stripe → Developers → Webhooks as a **Connect** endpoint
 * ("Events on connected accounts"), with these events:
 *   checkout.session.completed, checkout.session.async_payment_succeeded,
 *   checkout.session.async_payment_failed, checkout.session.expired,
 *   charge.refunded, account.updated
 * and put its signing secret in STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!isStripeConfigured() || !secret) {
    return new Response("Payments not configured", { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Idempotency: Stripe retries and may deliver an event more than once.
  const service = createServiceClient();
  const { error: dupError } = await service
    .from("stripe_events")
    .insert({ id: event.id, type: event.type, account: event.account ?? null });
  if (dupError) {
    if (dupError.code === "23505") return new Response("Already processed", { status: 200 });
    logger.error("stripe webhook: could not record event", { error: dupError.message });
    return new Response("Storage error", { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.expired":
        await applyCheckoutSession(event.data.object);
        break;
      case "checkout.session.async_payment_failed": {
        // Treat like expiry: release the slot. The session can't be paid now.
        const session = { ...event.data.object, status: "expired" } as Stripe.Checkout.Session;
        await applyCheckoutSession(session);
        break;
      }
      case "charge.refunded":
        await applyChargeRefunded(event.data.object);
        break;
      case "account.updated":
        await applyAccountState(event.data.object);
        break;
      default:
        break;
    }
  } catch (e) {
    // Let Stripe retry: forget the event so the retry is processed.
    await service.from("stripe_events").delete().eq("id", event.id);
    logger.error("stripe webhook handler failed", {
      type: event.type,
      error: e instanceof Error ? e.message : String(e),
    });
    return new Response("Handler error", { status: 500 });
  }

  return new Response("ok", { status: 200 });
}
