"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ExceptionEntry } from "@/lib/business/availability-actions";
import { Button } from "@/components/ui/button";

type Props = {
  exceptions: ExceptionEntry[];
  onSelectDate: (date: string) => void;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function AvailabilityCalendar({ exceptions, onSelectDate }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const exceptionMap = useMemo(() => {
    const map = new Map<string, ExceptionEntry>();
    for (const e of exceptions) {
      map.set(e.exceptionDate, e);
    }
    return map;
  }, [exceptions]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const prev = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const next = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={prev}>
          <ChevronLeft className="size-4" />
        </Button>
        <h3 className="font-semibold">
          {MONTH_NAMES[month]} {year}
        </h3>
        <Button variant="ghost" size="sm" onClick={next}>
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-12" />;
          }

          const dateStr = formatDate(year, month, day);
          const exc = exceptionMap.get(dateStr);
          const isToday = dateStr === todayStr;
          const isPast = new Date(dateStr) < new Date(todayStr);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`relative flex h-12 flex-col items-center justify-center rounded-lg text-sm transition-colors ${
                isPast
                  ? "text-muted-foreground/50"
                  : exc
                    ? exc.isClosed
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                    : "hover:bg-muted"
              } ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              <span>{day}</span>
              {exc && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-current" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
          Closed
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
          Custom hours
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/50" />
          Regular hours
        </span>
      </div>
    </div>
  );
}
