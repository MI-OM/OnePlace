"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Shield, ShieldCheck, ShieldAlert, Clock } from "lucide-react";

import { requestVerification } from "@/lib/business/verification-actions";
import { Button } from "@/components/ui/button";

type Props = {
  businessId: string;
  status: "unverified" | "pending" | "verified";
};

export function VerificationBadge({ businessId, status: initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();

  const handleRequest = () => {
    startTransition(async () => {
      const result = await requestVerification(businessId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Verification request submitted. Our team will review your business.");
        setStatus("pending");
      }
    });
  };

  if (status === "verified") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        <ShieldCheck className="size-3.5" />
        Verified business
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        <Clock className="size-3.5" />
        Verification pending
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
        <Shield className="size-3.5" />
        Not verified
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={handleRequest}
        disabled={pending}
      >
        {pending ? "Requesting..." : "Request verification"}
      </Button>
    </div>
  );
}
