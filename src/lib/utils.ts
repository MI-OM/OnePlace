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
