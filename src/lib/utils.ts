import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns `path` only if it is a same-origin relative path ("/foo"), else
 * `fallback`. Blocks open redirects like "https://evil", "//evil", "/\evil".
 */
export function safeRedirectPath(path: string | null | undefined, fallback = "/"): string {
  if (!path || typeof path !== "string") return fallback;
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return fallback;
  }
  for (let i = 0; i < path.length; i++) {
    if (path.charCodeAt(i) < 0x20) return fallback; // control chars, e.g. tab/newline
  }
  return path;
}

/**
 * Supabase embeds a many-to-one relation as an object at runtime, but
 * without generated DB types it is typed as an array. Accept either.
 */
export function one<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

/** Display name from a profiles row (there is no full_name column). */
export function personName(
  p: { display_name?: string | null; first_name?: string | null; last_name?: string | null } | undefined,
  fallback: string,
): string {
  if (!p) return fallback;
  return p.display_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || fallback;
}
