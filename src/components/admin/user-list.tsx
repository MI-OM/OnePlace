"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { Shield, ShieldOff } from "lucide-react";

import type { AdminUser } from "@/lib/admin";
import { toggleAdminRole } from "@/lib/admin-actions";

type Props = {
  users: AdminUser[];
};

export function UserList({ users: initial }: Props) {
  const [users, setUsers] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const handleToggleAdmin = useCallback((userId: string, currentIsAdmin: boolean) => {
    startTransition(async () => {
      const result = await toggleAdminRole(userId, !currentIsAdmin);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(currentIsAdmin ? "Admin role removed." : "Admin role granted.");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isPlatformAdmin: !currentIsAdmin } : u,
          ),
        );
      }
    });
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.displayName?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="mt-6">
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
      />

      <div className="mt-4 space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No users found.
          </p>
        )}
        {filtered.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user.displayName || user.email || "Unknown"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{user.businessCount} businesses</span>
              {user.isPlatformAdmin && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
                  Admin
                </span>
              )}
            </div>
            <button
              onClick={() => handleToggleAdmin(user.id, user.isPlatformAdmin)}
              disabled={pending}
              className={`p-1.5 transition-colors ${
                user.isPlatformAdmin
                  ? "text-primary hover:text-destructive"
                  : "text-muted-foreground hover:text-primary"
              }`}
              aria-label={user.isPlatformAdmin ? "Remove admin" : "Make admin"}
            >
              {user.isPlatformAdmin ? (
                <ShieldOff className="size-4" />
              ) : (
                <Shield className="size-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
