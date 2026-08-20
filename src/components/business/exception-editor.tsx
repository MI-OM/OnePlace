"use client";

import { useState } from "react";

import type { ExceptionEntry } from "@/lib/business/availability-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  date: string;
  existing: ExceptionEntry | null;
  onSave: (data: {
    exceptionDate: string;
    isClosed: boolean;
    opensAt: string | null;
    closesAt: string | null;
    reason: string | null;
  }) => void;
  onDelete: () => void;
  onClose: () => void;
  pending: boolean;
};

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ExceptionEditor({
  date,
  existing,
  onSave,
  onDelete,
  onClose,
  pending,
}: Props) {
  const [isClosed, setIsClosed] = useState(existing?.isClosed ?? true);
  const [opensAt, setOpensAt] = useState(existing?.opensAt ?? "09:00");
  const [closesAt, setClosesAt] = useState(existing?.closesAt ?? "17:00");
  const [reason, setReason] = useState(existing?.reason ?? "");

  const handleSave = () => {
    onSave({
      exceptionDate: date,
      isClosed,
      opensAt: isClosed ? null : opensAt,
      closesAt: isClosed ? null : closesAt,
      reason: reason || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{formatDisplayDate(date)}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set custom availability for this day.
        </p>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsClosed(false)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                !isClosed
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Open (custom hours)
            </button>
            <button
              type="button"
              onClick={() => setIsClosed(true)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                isClosed
                  ? "border-red-500 bg-red-50 text-red-700"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Closed
            </button>
          </div>

          {!isClosed && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Opens at</Label>
                <Input
                  type="time"
                  value={opensAt}
                  onChange={(e) => setOpensAt(e.target.value)}
                />
              </div>
              <div>
                <Label>Closes at</Label>
                <Input
                  type="time"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Holiday, special event, etc."
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {existing ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={pending}
            >
              Remove exception
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
