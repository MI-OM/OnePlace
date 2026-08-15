export function formatCurrency(
  amount: number,
  currency = "CAD",
  maximumFractionDigits = 0,
): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits,
  }).format(amount);
}

export function formatPrice(
  price: number | null,
  currency = "CAD",
): string | null {
  if (price === null) {
    return null;
  }
  return formatCurrency(price, currency);
}

export function priceLabel(
  service: {
    price: number | null;
    priceType: string;
    minPrice: number | null;
    maxPrice: number | null;
    currency: string;
  },
): string {
  const currency = service.currency || "CAD";

  switch (service.priceType) {
    case "fixed":
      return formatPrice(service.price, currency) ?? "Request a quote";
    case "starting_from":
      return `From ${formatPrice(service.minPrice ?? service.price, currency)}`;
    case "range":
      if (service.minPrice !== null && service.maxPrice !== null) {
        return `${formatCurrency(service.minPrice, currency)}–${formatCurrency(service.maxPrice, currency)}`;
      }
      return `From ${formatPrice(service.minPrice ?? service.price, currency)}`;
    case "quote_required":
    default:
      return "Request a quote";
  }
}

export function formatDuration(durationMinutes: number | null): string | null {
  if (durationMinutes === null || durationMinutes <= 0) {
    return null;
  }
  return `${durationMinutes} min`;
}

export function formatTime(time: string | null): string | null {
  if (time === null) {
    return null;
  }
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours)) {
    return null;
  }
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const minutePart = minutes > 0 ? `:${String(minutes).padStart(2, "0")}` : "";
  return `${hour12}${minutePart} ${suffix}`;
}

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function formatReviewDate(createdAt: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(createdAt));
}
