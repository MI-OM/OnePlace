import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getReportedReviews } from "@/lib/admin";
import { AdminExportBar } from "@/components/admin/admin-export-bar";
import { ReviewTable } from "@/components/admin/review-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Reported Reviews – Admin" };

export default async function AdminReviewsPage() {
  const reviews = await getReportedReviews();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Button render={<Link href="/admin" />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Admin
      </Button>

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reported Reviews
        </h1>
        <div className="flex items-center gap-3">
          <AdminExportBar section="reviews" />
          <span className="text-sm text-muted-foreground">
            {reviews.length} reported
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Reviews reported by business owners. Restore to republish or remove permanently.
      </p>

      <div className="mt-6">
        <ReviewTable reviews={reviews} />
      </div>
    </main>
  );
}
