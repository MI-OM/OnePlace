import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { getUser } from "@/lib/auth";
import { getAdminUsers } from "@/lib/admin";
import { AdminExportBar } from "@/components/admin/admin-export-bar";
import { UserList } from "@/components/admin/user-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Users — Admin" };

export default async function AdminUsersPage() {
  const user = await getUser();
  if (!user) notFound();

  let users;
  try {
    users = await getAdminUsers();
  } catch {
    return (
      <main className="flex h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Users className="size-8" aria-hidden />
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

      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage user accounts and admin roles.
          </p>
        </div>
        <AdminExportBar section="users" />
      </div>

      <UserList users={users} />
    </main>
  );
}
