import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getAdminBusinesses } from "@/lib/admin";
import { AdminExportBar } from "@/components/admin/admin-export-bar";
import { BusinessTable } from "@/components/admin/business-table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Manage Businesses – Admin" };

export default async function AdminBusinessesPage() {
  const businesses = await getAdminBusinesses();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Button render={<Link href="/admin" />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Admin
      </Button>

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Businesses</h1>
        <div className="flex items-center gap-3">
          <AdminExportBar section="businesses" />
          <span className="text-sm text-muted-foreground">
            {businesses.length} total
          </span>
        </div>
      </div>

      <div className="mt-6">
        <BusinessTable businesses={businesses} />
      </div>
    </main>
  );
}
