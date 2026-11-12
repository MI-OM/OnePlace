/**
 * Stripe Connect setup for booking payments.
 *
 * Model: direct charges. Each business has its own Stripe account (full
 * Stripe dashboard, pays its own Stripe fees, handles its own disputes).
 * Checkout Sessions are created *on the connected account*, so money goes
 * straight to the business. One Place can take an application fee, set by
 * STRIPE_PLATFORM_FEE_PERCENT (default 0).
 *
 * Server-only: never import this from a client component.
 */
import Stripe from "stripe";

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Lazily created so builds don't need the secret key. */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Online payments are not configured.");
  if (!client) {
    client = new Stripe(key, {
      appInfo: { name: "OnePlace" },
      maxNetworkRetries: 2,
      timeout: 20_000,
    });
  }
  return client;
}

export function appUrl(path = ""): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path}`;
}

/** How long a slot is held while the customer is in Stripe Checkout. */
export const CHECKOUT_HOLD_MINUTES = 31;
/** Stripe's minimum Checkout lifetime is 30 minutes. */
export const CHECKOUT_SESSION_MINUTES = 30;

/** Platform fee in basis points (1% = 100), from STRIPE_PLATFORM_FEE_PERCENT. */
export function platformFeeCents(amountCents: number): number {
  const pct = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? "0");
  if (!Number.isFinite(pct) || pct <= 0) return 0;
  const capped = Math.min(pct, 50);
  return Math.round((amountCents * capped) / 100);
}

export function toCents(amount: number | string | null | undefined): number | null {
  if (amount === null || amount === undefined) return null;
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function formatCents(cents: number, currency = "CAD"): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.trim().toUpperCase(),
  }).format(cents / 100);
}

/**
 * The amount a customer pays online when booking this service, or null if
 * the service doesn't take online payment (or isn't priced for it).
 */
export function onlinePaymentFor(service: {
  payment_mode: string | null;
  deposit_amount: number | string | null;
  price: number | string | null;
  price_type: string | null;
}): { kind: "deposit" | "full"; cents: number } | null {
  if (service.payment_mode === "full") {
    if (service.price_type !== "fixed") return null;
    const cents = toCents(service.price);
    return cents ? { kind: "full", cents } : null;
  }
  if (service.payment_mode === "deposit") {
    const cents = toCents(service.deposit_amount);
    return cents ? { kind: "deposit", cents } : null;
  }
  return null;
}

/**
 * Converts a wall-clock date + time in `timeZone` to a UTC Date.
 * e.g. ("2026-11-20", "14:30", "America/St_Johns").
 */
export function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);

  const offsetAt = (instant: number) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date(instant));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const wall = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    return wall - instant;
  };

  // Two passes handle instants near a DST change.
  let guess = asUtc - offsetAt(asUtc);
  guess = asUtc - offsetAt(guess);
  return new Date(guess);
}
