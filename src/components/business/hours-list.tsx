import type { BusinessHoursRow } from "@/lib/business";
import { DAY_LABELS, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function HoursList({
  hours,
  highlightDay,
}: {
  hours: BusinessHoursRow[];
  highlightDay?: number | null;
}) {
  return (
    <ul className="space-y-1.5 text-sm">
      {hours.map((entry) => (
        <li
          key={entry.dayOfWeek}
          className={cn(
            "flex items-baseline justify-between gap-4",
            entry.dayOfWeek === highlightDay &&
              "font-medium text-foreground",
          )}
        >
          <span className="text-muted-foreground">
            {DAY_LABELS[entry.dayOfWeek]}
          </span>
          <span className="text-right">
            {entry.isClosed || entry.opensAt === null || entry.closesAt === null
              ? "Closed"
              : `${formatTime(entry.opensAt)} \u2013 ${formatTime(entry.closesAt)}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
