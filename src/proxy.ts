import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = ["/account", "/conversations", "/onboarding"];

const AUTH_ONLY_PREFIXES = ["/login", "/signup", "/forgot-password", "/update-password"];

function matches(prefixes: string[], pathname: string) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // A redirect is a new response: carry over any refreshed session cookies
  // updateSession set, or the browser keeps a spent refresh token and the
  // user is randomly signed out later.
  const redirectWithSession = (url: URL) => {
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  };

  if (matches(PROTECTED_PREFIXES, pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return redirectWithSession(url);
  }

  if (matches(AUTH_ONLY_PREFIXES, pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirectWithSession(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
