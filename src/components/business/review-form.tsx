"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { submitReview } from "@/lib/business/review-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  businessId: string;
  hasReviewed?: boolean;
  onSubmitted?: () => void;
};

export function ReviewForm({ businessId, hasReviewed, onSubmitted }: Props) {
  if (hasReviewed) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-sm font-medium">You&apos;ve already reviewed this business.</p>
      </div>
    );
  }
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    startTransition(async () => {
      const result = await submitReview({
        businessId,
        rating,
        title: title || undefined,
        body: body || undefined,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Review published!");
        setSubmitted(true);
        onSubmitted?.();
      }
    });
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-sm font-medium">Thanks for your review!</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Your review is now visible on this business page.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-medium">Write a review</h3>

      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => setRating(value)}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`${value} star${value !== 1 ? "s" : ""}`}
          >
            <Star
              className={`size-6 ${
                value <= (hoveredRating || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-zinc-200"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {rating}/5
          </span>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <Input
          placeholder="Review title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />
        <Textarea
          placeholder="Share your experience..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button size="sm" onClick={handleSubmit} disabled={pending || rating === 0}>
          {pending ? "Submitting..." : "Submit review"}
        </Button>
      </div>
    </div>
  );
}
