"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Suggestion = {
  id: string | null;
  name: string;
  slug: string;
  category_name: string | null;
  city: string | null;
  kind: "business" | "category";
};

/**
 * Search box with debounced autocomplete.
 * Falls back to a plain form submit when JS is disabled.
 */
export function SearchBox({
  defaultValue,
  placeholder = "What are you looking for?",
  submitLabel = "Find a service",
  autoFocus = false,
  size = "default",
}: {
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
  size?: "default" | "large";
}) {
  const [query, setQuery] = useState(defaultValue ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/autocomplete?q=${encodeURIComponent(q.trim())}`);
        const data = (await res.json()) as Suggestion[];
        setSuggestions(data);
        setOpen(data.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 250);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    fetchSuggestions(value);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const s = suggestions[activeIndex];
      if (s.kind === "category" && s.slug) {
        window.location.href = `/categories/${s.slug}`;
      } else if (s.slug) {
        window.location.href = `/businesses/${s.slug}`;
      }
      setOpen(false);
    }
  }

  function selectSuggestion(s: Suggestion) {
    if (s.kind === "category" && s.slug) {
      window.location.href = `/categories/${s.slug}`;
    } else if (s.slug) {
      window.location.href = `/businesses/${s.slug}`;
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form action="/search" role="search">
        <div
          className={
            size === "large"
              ? "flex flex-col gap-3 sm:flex-row"
              : "flex flex-col gap-2 sm:flex-row"
          }
        >
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus={autoFocus}
              aria-label={placeholder}
              aria-autocomplete="list"
              aria-expanded={open}
              role="combobox"
              autoComplete="off"
              className={`w-full rounded-[10px] border border-input bg-card pr-4 text-foreground outline-none ring-ring transition focus-visible:ring-2 ${
                size === "large"
                  ? "h-12 pl-12 text-base"
                  : "h-11 pl-11 text-sm"
              }`}
            />
          </div>
          <Button
            type="submit"
            size={size === "large" ? "lg" : "default"}
            className={size === "large" ? "h-12 px-6" : "px-5"}
          >
            {submitLabel}
          </Button>
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.kind}-${s.id ?? s.slug}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              className={`cursor-pointer px-4 py-2.5 text-sm transition hover:bg-accent ${
                i === activeIndex ? "bg-accent" : ""
              }`}
              onMouseDown={() => selectSuggestion(s)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">{s.name}</span>
                {s.kind === "category" ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Category
                  </span>
                ) : (
                  s.city && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {s.city}
                    </span>
                  )
                )}
              </div>
              {s.category_name && s.kind === "business" && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {s.category_name}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
