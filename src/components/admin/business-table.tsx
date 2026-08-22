"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Ban, Shield, ShieldOff, Star, Megaphone, Pencil, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  updateBusinessStatus,
  updateVerificationStatus,
  toggleFeatured,
  toggleSponsored,
  promoteToBusinessOwner,
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
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [promoteError, setPromoteError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);

  async function handlePromote() {
    if (!promoteEmail.trim()) return;
    setPromoting(true);
    setPromoteError(null);
    const result = await promoteToBusinessOwner(business.id, promoteEmail.trim());
    if (result.ok) {
      setPromoteOpen(false);
      startTransition(() => {});
    } else {
      setPromoteError(result.error ?? "Failed to assign owner.");
    }
    setPromoting(false);
  }

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
          <Button
            size="sm"
            variant="outline"
            render={<Link href={`/admin/businesses/${business.id}/edit`} />}
          >
            <Pencil className="mr-1 size-3" aria-hidden />
            Edit
          </Button>

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

          <Button
            size="sm"
            variant="outline"
            disabled={pending || promoting}
            onClick={() => {
              setPromoteOpen(true);
              setPromoteEmail("");
              setPromoteError(null);
            }}
          >
            <UserPlus className="mr-1 size-3" aria-hidden />
            Make Owner
          </Button>
        </div>
      </div>

      {promoteOpen && (
        <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3">
          <p className="mb-2 text-sm font-medium">Assign business owner</p>
          <input
            type="text"
            value={promoteEmail}
            onChange={(e) => setPromoteEmail(e.target.value)}
            placeholder="Enter email or user ID"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && promoteEmail.trim()) {
                handlePromote();
              }
              if (e.key === "Escape") setPromoteOpen(false);
            }}
          />
          {promoteError && (
            <p className="mt-1 text-xs text-destructive">{promoteError}</p>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPromoteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!promoteEmail.trim() || promoting}
              onClick={handlePromote}
            >
              {promoting ? "Assigning…" : "Assign Owner"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
