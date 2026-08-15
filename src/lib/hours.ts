import type { BusinessHoursRow } from "@/lib/business";

export type OpenNowStatus = {
  open: boolean;
  label: string;
};

const DAYS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getBusinessDayIndex(
  timezone: string,
  now: Date = new Date(),
): number {
  const weekday =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      weekday: "short",
    }).formatToParts(now).find((part) => part.type === "weekday")?.value ?? "";
  return DAYS[weekday] ?? 0;
}

export function getOpenNowStatus(
  hours: BusinessHoursRow[],
  timezone: string,
  now: Date = new Date(),
): OpenNowStatus {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? "0",
  );

  const dayOfWeek = DAYS[weekday];
  const row = hours.find((entry) => entry.dayOfWeek === dayOfWeek);

  if (
    row === undefined ||
    row.isClosed ||
    row.opensAt === null ||
    row.closesAt === null
  ) {
    return { open: false, label: "Closed" };
  }

  const [openHours, openMinutes] = row.opensAt.split(":").map(Number);
  const [closeHours, closeMinutes] = row.closesAt.split(":").map(Number);
  const nowMinutes = hour * 60 + minute;
  const openMinutesTotal = openHours * 60 + openMinutes;
  const closeMinutesTotal = closeHours * 60 + closeMinutes;

  return nowMinutes >= openMinutesTotal && nowMinutes < closeMinutesTotal
    ? { open: true, label: "Open now" }
    : { open: false, label: "Closed" };
}
