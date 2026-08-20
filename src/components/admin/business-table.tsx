"use client";

import { useTransition } from "react";
import { Check, Ban, Shield, ShieldOff, Star, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  updateBusinessStatus,
  updateVerificationStatus,
  toggleFeatured,
  toggleSponsored,
} from "@/lib/admin-actions";
import type { AdminBusiness } from "@/lib/admin";

export function BusinessTable({
  businesses,
}: {
  businesses: AdminBusiness[];
}) {
  return (
    <div className="space-y-3">
      {businesses.map((b) => (
        <BusinessRow key={b.id} business={b} />
      ))}
      {businesses.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No businesses found.
        </p>
      )}
    </div>
  );
}

function BusinessRow({ business }: { business: AdminBusiness }) {
  const [pending, startTransition] = useTransition();

  const statusColor =
    business.status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : business.status === "suspended"
        ? "bg-amber-100 text-amber-700"
        : "bg-zinc-100 text-zinc-500";

  const verificationColor =
    business.verificationStatus === "verified"
      ? "bg-emerald-100 text-emerald-700"
      : business.verificationStatus === "pending"
        ? "bg-amber-100 text-amber-700"
        : "bg-zinc-100 text-zinc-500";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold">{business.name}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor}`}>
              {business.status}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${verificationColor}`}>
              {business.verificationStatus}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[business.city, business.province].filter(Boolean).join(", ")} ·{" "}
            {business.memberCount} member{business.memberCount !== 1 ? "s" : ""} ·{" "}
            {new Date(business.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {business.verificationStatus === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(() =>
                    updateVerificationStatus(business.id, "verified"),
                  )
                }
              >
                <Check className="mr-1 size-3" aria-hidden />
                Verify
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(() =>
                    updateVerificationStatus(business.id, "unverified"),
                  )
                }
              >
                <Ban className="mr-1 size-3" aria-hidden />
                Deny
              </Button>
            </>
          )}

          {business.verificationStatus === "verified" && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  updateVerificationStatus(business.id, "unverified"),
                )
              }
            >
              <Ban className="mr-1 size-3" aria-hidden />
              Revoke verification
            </Button>
          )}

          {business.status === "active" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  updateBusinessStatus(business.id, "suspended"),
                )
              }
            >
              <ShieldOff className="mr-1 size-3" aria-hidden />
              Suspend
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(() =>
                  updateBusinessStatus(business.id, "active"),
                )
              }
            >
              <Shield className="mr-1 size-3" aria-hidden />
              Activate
            </Button>
          )}

          <Button
            size="sm"
            variant={business.isFeatured ? "default" : "outline"}
            disabled={pending}
            onClick={() =>
              startTransition(() => {
                void toggleFeatured(business.id, !business.isFeatured);
              })
            }
          >
            <Star className="mr-1 size-3" aria-hidden />
            {business.isFeatured ? "Featured" : "Feature"}
          </Button>

          <Button
            size="sm"
            variant={business.isSponsored ? "default" : "outline"}
            disabled={pending}
            onClick={() =>
              startTransition(() => {
                void toggleSponsored(business.id, !business.isSponsored);
              })
            }
          >
            <Megaphone className="mr-1 size-3" aria-hidden />
            {business.isSponsored ? "Sponsored" : "Sponsor"}
          </Button>
        </div>
      </div>
    </div>
  );
}
