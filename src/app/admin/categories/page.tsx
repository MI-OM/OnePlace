import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Tag } from "lucide-react";

import { getUser } from "@/lib/auth";
import { getAdminCategories } from "@/lib/admin";
import { CategoryManager } from "@/components/admin/category-manager";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Categories — Admin" };

export default async function AdminCategoriesPage() {
  const user = await getUser();
  if (!user) notFound();

  let categories;
  try {
    categories = await getAdminCategories();
  } catch {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Tag className="size-8" aria-hidden />
        <p>You don&apos;t have admin access.</p>
        <Button render={<Link href="/" />}>Back to Home</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <Button render={<Link href="/admin" />} variant="ghost" size="sm" className="mb-6 -ml-2">
        <ArrowLeft className="mr-1 size-4" aria-hidden />
        Admin panel
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage service categories shown to customers.
      </p>

      <CategoryManager categories={categories} />
    </main>
  );
}
