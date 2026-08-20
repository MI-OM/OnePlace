"use client";

import { useTransition } from "react";
import { Check, Trash2, Star, Flag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { moderateReportedReview } from "@/lib/admin-actions";
import type { AdminReview } from "@/lib/admin";

export function ReviewTable({ reviews }: { reviews: AdminReview[] }) {
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewRow key={r.id} review={r} />
      ))}
      {reviews.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No reported reviews.
        </p>
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: AdminReview }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-3.5 ${
                  i < review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-zinc-200"
                }`}
                aria-hidden
              />
            ))}
            <span className="text-xs text-muted-foreground">
              {review.rating}/5
            </span>
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
              <Flag className="size-2.5" />
              Reported
            </span>
          </div>
          {review.title && (
            <p className="mt-1 text-sm font-medium">{review.title}</p>
          )}
          {review.body && (
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
              {review.body}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {review.reviewerName} · {review.businessName} ·{" "}
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
          {review.reportReason && (
            <p className="mt-1 text-xs text-red-600">
              Report reason: {review.reportReason}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(() => moderateReportedReview(review.id, "published"))
            }
          >
            <Check className="mr-1 size-3" aria-hidden />
            Restore
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(() => moderateReportedReview(review.id, "removed"))
            }
          >
            <Trash2 className="mr-1 size-3" aria-hidden />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
