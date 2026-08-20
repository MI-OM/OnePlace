import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createAnonClient } from "@/lib/supabase/anon";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = createAnonClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = `${baseUrl}/businesses/${slug}`;

  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 2,
    width: 256,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
