import Link from "next/link";

import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/site-header/user-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";

export async function SiteHeader() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
        >
          OnePlace
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            render={<Link href="/search" />}
          >
            Explore
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            render={<Link href="/for-businesses" />}
          >
            For businesses
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <NotificationBell />
              <UserMenu
                name={user.user_metadata?.display_name ?? null}
                email={user.email ?? null}
              />
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                render={<Link href="/login" />}
              >
                Sign in
              </Button>
              <Button render={<Link href="/signup" />}>Create account</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
