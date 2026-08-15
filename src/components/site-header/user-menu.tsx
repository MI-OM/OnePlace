"use client";

import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function UserMenu({
  name,
  email,
}: {
  name: string | null;
  email: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium outline-none transition-colors hover:bg-muted"
        aria-label="Account menu"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {(name ?? email ?? "U").charAt(0).toUpperCase()}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {name ?? "Your account"}
          {email ? (
            <span className="block text-xs font-normal text-muted-foreground">
              {email}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/account" />}>
          Your account
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/business" />}>
          My business
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className="p-0">
          <SignOutButton className="h-auto w-full justify-start rounded-none bg-transparent px-1.5 py-1 text-sm text-destructive hover:bg-destructive/10" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
