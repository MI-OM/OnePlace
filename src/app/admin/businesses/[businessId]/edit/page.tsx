import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { BusinessContentEditor } from "@/components/admin/business-content-editor";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit business — OnePlace Admin" };

export default async function AdminEditBusinessPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await getUser();
  if (!user) notFound();

  const { businessId } = await params;
  const service = createServiceClient();

  const { data: business } = await service
    .from("businesses")
    .select("id, name, description, phone, email, website_url, address_line1, city, province, postal_code, country, timezone, founded_year")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) notFound();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Button
        render={<Link href="/admin/businesses" />}
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2"
      >
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        All businesses
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Edit business</h1>
      <p className="mt-2 text-sm text-muted-foreground">{business.name}</p>

      <div className="mt-8">
        <BusinessContentEditor business={business} />
      </div>
    </main>
  );
}
