"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { ExceptionEntry } from "@/lib/business/availability-actions";
import { getExceptions, upsertException, deleteException } from "@/lib/business/availability-actions";
import { AvailabilityCalendar } from "@/components/business/availability-calendar";
import { ExceptionEditor } from "@/components/business/exception-editor";
import { Button } from "@/components/ui/button";

type Props = {
  businessId: string;
  initialExceptions: ExceptionEntry[];
  initialYear: number;
  initialMonth: number;
};

export function AvailabilityPageClient({
  businessId,
  initialExceptions,
  initialYear,
  initialMonth,
}: Props) {
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [pending, startTransition] = useTransition();

  const loadExceptions = useCallback(
    async (y: number, m: number) => {
      const data = await getExceptions(businessId, y, m);
      setExceptions(data);
    },
    [businessId],
  );

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const existing = selectedDate
    ? exceptions.find((e) => e.exceptionDate === selectedDate) ?? null
    : null;

  const handleSave = useCallback(
    (data: {
      exceptionDate: string;
      isClosed: boolean;
      opensAt: string | null;
      closesAt: string | null;
      reason: string | null;
    }) => {
      startTransition(async () => {
        const result = await upsertException(businessId, data);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success("Exception saved.");
          setSelectedDate(null);
          await loadExceptions(year, month + 1);
        }
      });
    },
    [businessId, year, month, loadExceptions],
  );

  const handleDelete = useCallback(() => {
    if (!selectedDate) return;
    startTransition(async () => {
      const result = await deleteException(businessId, selectedDate);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Exception removed.");
        setSelectedDate(null);
        loadExceptions(year, month + 1);
      }
    });
  }, [businessId, selectedDate, year, month, loadExceptions]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10">
      <Button
        render={<Link href={`/dashboard/${businessId}`} />}
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Back to inbox
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">
        Availability Calendar
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Click a day to set custom hours or mark it as closed. Regular hours
        come from your{" "}
        <Link
          href={`/dashboard/${businessId}/settings`}
          className="underline hover:text-foreground"
        >
          business settings
        </Link>
        .
      </p>

      <div className="mt-6">
        <AvailabilityCalendar
          exceptions={exceptions}
          onSelectDate={handleSelectDate}
        />
      </div>

      {selectedDate && (
        <ExceptionEditor
          date={selectedDate}
          existing={existing}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSelectedDate(null)}
          pending={pending}
        />
      )}
    </main>
  );
}
