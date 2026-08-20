"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";

import { reportReview } from "@/lib/business/review-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  reviewId: string;
  businessId: string;
  isOwner: boolean;
};

export function ReportReviewButton({ reviewId, businessId, isOwner }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const [reported, setReported] = useState(false);

  if (!isOwner || reported) return null;

  const handleReport = () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    startTransition(async () => {
      const result = await reportReview({
        reviewId,
        businessId,
        reason: reason.trim(),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Review reported. Our team will review it.");
        setReported(true);
        setShowForm(false);
      }
    });
  };

  if (showForm) {
    return (
      <div className="mt-2 rounded-lg border border-border bg-background p-3">
        <p className="text-xs font-medium text-muted-foreground">
          Why are you reporting this review?
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Spam, fake review, inappropriate content..."
          rows={2}
          className="mt-2"
          maxLength={500}
        />
        <div className="mt-2 flex gap-2">
          <Button size="sm" onClick={handleReport} disabled={pending}>
            {pending ? "Reporting..." : "Submit report"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShowForm(true)}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
    >
      <Flag className="size-3" />
      Report
    </button>
  );
}
