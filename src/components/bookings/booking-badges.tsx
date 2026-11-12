import { cn } from "@/lib/utils";

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Requested", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200" },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200" },
  no_show: { label: "No-show", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
};

const PAYMENT: Record<string, { label: string; className: string } | null> = {
  not_required: null,
  awaiting_payment: { label: "Awaiting payment", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200" },
  paid: { label: "Paid", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" },
  partially_refunded: { label: "Partly refunded", className: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200" },
  refunded: { label: "Refunded", className: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200" },
  expired: { label: "Payment expired", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  failed: { label: "Payment failed", className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200" },
};

const pill = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

export function BookingStatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, className: "bg-muted text-foreground" };
  return <span className={cn(pill, s.className)}>{s.label}</span>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const s = PAYMENT[status];
  if (!s) return null;
  return <span className={cn(pill, s.className)}>{s.label}</span>;
}

export function formatMoney(cents: number, currency = "CAD") {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: currency.trim().toUpperCase(),
  }).format(cents / 100);
}

export function formatBookingWhen(date: string, start: string, end?: string) {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${day} · ${start.slice(0, 5)}${end ? `–${end.slice(0, 5)}` : ""}`;
}
