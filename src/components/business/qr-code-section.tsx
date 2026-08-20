"use client";

import { useCallback, useState } from "react";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Props = {
  businessSlug: string;
};

export function QrCodeSection({ businessSlug }: Props) {
  const [copied, setCopied] = useState(false);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const businessUrl = `${baseUrl}/businesses/${businessSlug}`;
  const qrApiUrl = `/api/qr/${businessSlug}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(businessUrl);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  }, [businessUrl]);

  const handleDownload = useCallback(
    async (format: "svg" | "png") => {
      try {
        if (format === "svg") {
          const res = await fetch(qrApiUrl);
          const blob = await res.blob();
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `${businessSlug}-qr.svg`;
          a.click();
          URL.revokeObjectURL(a.href);
        } else {
          const res = await fetch(qrApiUrl);
          const svgText = await res.text();
          const img = new Image();
          const blob = new Blob([svgText], { type: "image/svg+xml" });
          img.src = URL.createObjectURL(blob);
          await new Promise((resolve) => {
            img.onload = resolve;
          });
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d")!;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, 512, 512);
          ctx.drawImage(img, 0, 0, 512, 512);
          canvas.toBlob((pngBlob) => {
            if (!pngBlob) return;
            const a = document.createElement("a");
            a.href = URL.createObjectURL(pngBlob);
            a.download = `${businessSlug}-qr.png`;
            a.click();
            URL.revokeObjectURL(a.href);
          }, "image/png");
          URL.revokeObjectURL(img.src);
        }
        toast.success(`QR code downloaded as ${format.toUpperCase()}.`);
      } catch {
        toast.error("Failed to download QR code.");
      }
    },
    [qrApiUrl, businessSlug],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="font-medium">QR Code</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Share this QR code so customers can find your business page.
      </p>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrApiUrl}
          alt={`QR code for ${businessSlug}`}
          className="size-40 rounded-lg border border-border bg-white p-2"
        />

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground break-all">{businessUrl}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopyLink}>
              {copied ? (
                <Check className="mr-1 size-3.5" />
              ) : (
                <Copy className="mr-1 size-3.5" />
              )}
              {copied ? "Copied" : "Copy link"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDownload("svg")}>
              <Download className="mr-1 size-3.5" />
              SVG
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDownload("png")}>
              <Download className="mr-1 size-3.5" />
              PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
