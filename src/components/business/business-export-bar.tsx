"use client";

import { ExportButton } from "@/components/ui/export-button";
import {
  exportBusinessBookingsCSV,
  exportBusinessRequestsCSV,
  exportBusinessReviewsCSV,
  getBusinessBookingsData,
  getBusinessRequestsData,
  getBusinessReviewsData,
} from "@/lib/business/report-actions";

export function BusinessExportBar({ businessId }: { businessId: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ExportButton
        label="Bookings"
        fetchCSV={() => exportBusinessBookingsCSV(businessId)}
        fetchPDFData={async () => {
          const data = await getBusinessBookingsData(businessId);
          return {
            title: "Bookings Report",
            ...data,
            filename: `bookings-${businessId.slice(0, 8)}`,
          };
        }}
        filename={`bookings-${businessId.slice(0, 8)}`}
      />
      <ExportButton
        label="Requests"
        fetchCSV={() => exportBusinessRequestsCSV(businessId)}
        fetchPDFData={async () => {
          const data = await getBusinessRequestsData(businessId);
          return {
            title: "Service Requests Report",
            ...data,
            filename: `requests-${businessId.slice(0, 8)}`,
          };
        }}
        filename={`requests-${businessId.slice(0, 8)}`}
      />
      <ExportButton
        label="Reviews"
        fetchCSV={() => exportBusinessReviewsCSV(businessId)}
        fetchPDFData={async () => {
          const data = await getBusinessReviewsData(businessId);
          return {
            title: "Reviews Report",
            ...data,
            filename: `reviews-${businessId.slice(0, 8)}`,
          };
        }}
        filename={`reviews-${businessId.slice(0, 8)}`}
      />
    </div>
  );
}
