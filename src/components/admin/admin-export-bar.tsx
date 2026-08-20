"use client";

import { ExportButton } from "@/components/ui/export-button";
import {
  exportAdminBusinessesCSV,
  exportAdminUsersCSV,
  exportAdminReviewsCSV,
  getAdminBusinessesData,
  getAdminUsersData,
  getAdminReviewsData,
} from "@/lib/admin-reports";

export function AdminExportBar({ section }: { section: "businesses" | "users" | "reviews" }) {
  if (section === "businesses") {
    return (
      <ExportButton
        label="Export"
        fetchCSV={exportAdminBusinessesCSV}
        fetchPDFData={async () => {
          const data = await getAdminBusinessesData();
          return {
            title: "Businesses Report",
            subtitle: "All businesses on OnePlace",
            ...data,
            filename: "admin-businesses",
          };
        }}
        filename="admin-businesses"
      />
    );
  }

  if (section === "users") {
    return (
      <ExportButton
        label="Export"
        fetchCSV={exportAdminUsersCSV}
        fetchPDFData={async () => {
          const data = await getAdminUsersData();
          return {
            title: "Users Report",
            subtitle: "All registered users",
            ...data,
            filename: "admin-users",
          };
        }}
        filename="admin-users"
      />
    );
  }

  return (
    <ExportButton
      label="Export"
      fetchCSV={exportAdminReviewsCSV}
      fetchPDFData={async () => {
        const data = await getAdminReviewsData();
        return {
          title: "Reviews Report",
          subtitle: "All reviews across OnePlace",
          ...data,
          filename: "admin-reviews",
        };
      }}
      filename="admin-reviews"
    />
  );
}
