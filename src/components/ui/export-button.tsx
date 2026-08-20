"use client";

import { useState, useTransition } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadCSV } from "@/lib/csv";
import { downloadPDF } from "@/lib/pdf";

type PDFData = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  filename: string;
};

type ExportButtonProps = {
  label: string;
  fetchCSV: () => Promise<string>;
  fetchPDFData?: () => Promise<PDFData>;
  filename: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
};

export function ExportButton({
  label,
  fetchCSV,
  fetchPDFData,
  filename,
  variant = "outline",
  size = "sm",
}: ExportButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleCSV = () => {
    startTransition(async () => {
      try {
        const csv = await fetchCSV();
        downloadCSV(csv, `${filename}.csv`);
        toast.success(`${label} exported as CSV.`);
      } catch {
        toast.error("Export failed.");
      }
    });
  };

  const handlePDF = () => {
    if (!fetchPDFData) return;
    startTransition(async () => {
      try {
        const data = await fetchPDFData();
        downloadPDF(data);
        toast.success(`${label} exported as PDF.`);
      } catch {
        toast.error("Export failed.");
      }
    });
  };

  return (
    <div className="flex gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleCSV}
        disabled={pending}
      >
        <Download className="mr-1 size-3.5" />
        {pending ? "..." : `${label} CSV`}
      </Button>
      {fetchPDFData && (
        <Button
          variant={variant}
          size={size}
          onClick={handlePDF}
          disabled={pending}
        >
          <Download className="mr-1 size-3.5" />
          {pending ? "..." : `${label} PDF`}
        </Button>
      )}
    </div>
  );
}
