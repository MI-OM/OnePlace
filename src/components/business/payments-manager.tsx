"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, CreditCard, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import {
  refreshStripeStatus,
  startStripeOnboarding,
  updatePaymentSettings,
} from "@/lib/payments/actions";
import type { PaymentsOverview } from "@/lib/payments/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PaymentStatusBadge,
  formatBookingWhen,
  formatMoney,
} from "@/components/bookings/booking-badges";

type Props = {
  businessId: string;
  isOwner: boolean;
  overview: PaymentsOverview;
};

type Mode = "none" | "deposit" | "full";

export function PaymentsManager({ businessId, isOwner, overview }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [windowHours, setWindowHours] = useState(String(overview.cancellationWindowHours));
  const [services, setServices] = useState(
    overview.services.map((s) => ({
      ...s,
      depositInput: s.depositAmount !== null ? String(s.depositAmount) : "",
    })),
  );

  const connected = Boolean(overview.stripeAccountId);
  const live = overview.chargesEnabled;

  const connect = () =>
    startTransition(async () => {
      const result = await startStripeOnboarding(businessId);
      if (result.ok) window.location.assign(result.url);
      else toast.error(result.error);
    });

  const refresh = () =>
    startTransition(async () => {
      const result = await refreshStripeStatus(businessId);
      if (!result.ok) toast.error(result.error);
      else if (result.chargesEnabled) toast.success("Stripe is connected. You can take payments.");
      else toast.message("Stripe still needs a few details. Finish setup to start taking payments.");
      router.refresh();
    });

  const setMode = (id: string, mode: Mode) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, paymentMode: mode } : s)));
  const setDeposit = (id: string, value: string) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, depositInput: value } : s)));

  const save = () =>
    startTransition(async () => {
      const hours = Number(windowHours);
      if (!Number.isInteger(hours) || hours < 0 || hours > 720) {
        toast.error("Cancellation window must be between 0 and 720 hours.");
        return;
      }
      const result = await updatePaymentSettings(businessId, {
        cancellationWindowHours: hours,
        services: services.map((s) => ({
          id: s.id,
          paymentMode: s.paymentMode,
          depositAmount:
            s.paymentMode === "deposit" && s.depositInput.trim() !== ""
              ? Number(s.depositInput)
              : null,
        })),
      });
      if (result.ok) {
        toast.success("Payment settings saved.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  return (
    <div className="mt-8 space-y-8">
      {/* ── Stripe connection ─────────────────────────────── */}
      <section className="rounded-2xl border border-border p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-muted p-2">
            {live ? (
              <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
            ) : (
              <CreditCard className="size-5 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-medium">
              {live ? "Taking payments with Stripe" : connected ? "Finish Stripe setup" : "Get paid online"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {!overview.stripeConfigured
                ? "Online payments aren't switched on for One Place yet. Check back soon."
                : live
                  ? "Customers pay you directly through Stripe when they book. Payouts, receipts and disputes are handled in your Stripe dashboard."
                  : connected
                    ? "Stripe needs a few more details (like your bank account) before you can take payments."
                    : "Connect a Stripe account so customers can pay a deposit or the full price when they book. Money goes straight to you. One Place doesn't take a cut."}
            </p>

            {overview.stripeConfigured && (
              <div className="mt-4 flex flex-wrap gap-2">
                {!live &&
                  (isOwner ? (
                    <Button onClick={connect} disabled={pending}>
                      {pending ? <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden /> : null}
                      {connected ? "Continue Stripe setup" : "Connect Stripe"}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ask the business owner to connect Stripe.</p>
                  ))}
                {connected && (
                  <Button variant="outline" onClick={refresh} disabled={pending}>
                    <RefreshCw className="mr-1.5 size-4" aria-hidden />
                    Check status
                  </Button>
                )}
                {live && (
                  <Button
                    variant="outline"
                    render={<a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" />}
                  >
                    Open Stripe dashboard
                    <ExternalLink className="ml-1.5 size-4" aria-hidden />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Settings ──────────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-medium">Payment at booking</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose what customers pay online for each service.
            {!live && " These settings take effect once Stripe is connected."}
          </p>
        </div>

        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add services in Settings first.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {services.map((s) => {
              const canTakeFull = s.priceType === "fixed" && s.price !== null && s.price > 0;
              return (
                <li key={s.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.price !== null
                        ? `${s.priceType === "fixed" ? "" : "From "}${formatMoney(Math.round(s.price * 100), s.currency)}`
                        : "No set price"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`Payment for ${s.name}`}
                      value={s.paymentMode}
                      onChange={(e) => setMode(s.id, e.target.value as Mode)}
                      className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                    >
                      <option value="none">Pay at appointment</option>
                      <option value="deposit">Deposit online</option>
                      <option value="full" disabled={!canTakeFull}>
                        Full price online{canTakeFull ? "" : " (needs fixed price)"}
                      </option>
                    </select>
                    {s.paymentMode === "deposit" && (
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">$</span>
                        <Input
                          aria-label={`Deposit for ${s.name}`}
                          inputMode="decimal"
                          value={s.depositInput}
                          onChange={(e) => setDeposit(s.id, e.target.value)}
                          className="h-9 w-24"
                          placeholder="20.00"
                        />
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="grid max-w-xs gap-1.5">
          <Label htmlFor="cancel-window">Free cancellation until (hours before)</Label>
          <Input
            id="cancel-window"
            inputMode="numeric"
            value={windowHours}
            onChange={(e) => setWindowHours(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Customers can cancel online with a full refund up to this many hours before their
            appointment. After that they need to message you.
          </p>
        </div>

        <Button onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save payment settings"}
        </Button>
      </section>

      {/* ── Recent payments ───────────────────────────────── */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-medium">Recent payments</h2>
          {overview.totals.count > 0 && (
            <p className="text-sm text-muted-foreground">
              {formatMoney(overview.totals.paidCents - overview.totals.refundedCents)} net
            </p>
          )}
        </div>
        {overview.recentPayments.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {overview.recentPayments.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.customerName ?? "Customer"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBookingWhen(p.bookingDate, p.startTime)}
                    {p.paymentKind === "deposit" ? " · deposit" : ""}
                  </p>
                </div>
                <PaymentStatusBadge status={p.paymentStatus} />
                <span className="w-20 text-right font-medium tabular-nums">
                  {formatMoney(p.amountPaidCents - p.amountRefundedCents, p.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
