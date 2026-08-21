"use client";

import Link from "next/link";
import { useTransition } from "react";
import { MessageSquare, Clock, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { updateRequestStatus, type ServiceRequestItem } from "@/lib/business/request-actions";
import { Button } from "@/components/ui/button";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  information: "Information",
  availability: "Availability",
  quote: "Quote",
  booking: "Booking",
  callback: "Callback",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  expired: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

export function RequestsManager({
  businessId,
  initialRequests,
}: {
  businessId: string;
  initialRequests: ServiceRequestItem[];
}) {
  const [pending, startTransition] = useTransition();

  const handleStatusChange = (requestId: string, newStatus: string) => {
    startTransition(async () => {
      const result = await updateRequestStatus(businessId, requestId, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Request updated.");
      }
    });
  };

  if (initialRequests.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
        <Clock className="mx-auto size-8 text-primary" aria-hidden />
        <h2 className="mt-4 text-lg font-semibold">No requests yet</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Service requests from customers will appear here.
        </p>
      </div>
    );
  }

  const openRequests = initialRequests.filter((r) => r.status === "open");
  const otherRequests = initialRequests.filter((r) => r.status !== "open");

  return (
    <div className="mt-6 space-y-6">
      {openRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Open ({openRequests.length})
          </h2>
          <ul className="space-y-3">
            {openRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                businessId={businessId}
                pending={pending}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        </div>
      )}

      {otherRequests.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            History ({otherRequests.length})
          </h2>
          <ul className="space-y-3">
            {otherRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                businessId={businessId}
                pending={pending}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RequestRow({
  request,
  businessId,
  pending,
  onStatusChange,
}: {
  request: ServiceRequestItem;
  businessId: string;
  pending: boolean;
  onStatusChange: (id: string, status: string) => void;
}) {
  const created = new Date(request.createdAt);
  const dateStr = created.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{request.customerName}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[request.status] ?? ""}`}
            >
              {request.status.replace("_", " ")}
            </span>
          </div>

          {request.serviceName && (
            <p className="mt-1 text-sm text-muted-foreground">
              Service: {request.serviceName}
            </p>
          )}

          {request.requestedDate && (
            <p className="mt-1 text-sm text-muted-foreground">
              Requested: {request.requestedDate}
              {request.requestedTime ? ` at ${request.requestedTime}` : ""}
            </p>
          )}

          {request.notes && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {request.notes}
            </p>
          )}

          <p className="mt-2 text-xs text-muted-foreground">{dateStr}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {request.conversationId && (
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link
                  href={`/dashboard/conversations/${request.conversationId}`}
                />
              }
            >
              <MessageSquare className="size-4" aria-hidden />
            </Button>
          )}

          {request.status === "open" && (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => onStatusChange(request.id, "in_progress")}
              >
                <Clock className="size-4 mr-1" aria-hidden />
                In progress
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => onStatusChange(request.id, "completed")}
              >
                <CheckCircle2 className="size-4 mr-1" aria-hidden />
                Complete
              </Button>
            </>
          )}

          {request.status === "in_progress" && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => onStatusChange(request.id, "completed")}
            >
              <CheckCircle2 className="size-4 mr-1" aria-hidden />
              Complete
            </Button>
          )}

          {(request.status === "open" || request.status === "in_progress") && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => onStatusChange(request.id, "cancelled")}
            >
              <XCircle className="size-4 mr-1" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
