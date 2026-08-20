import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Category } from "@/lib/discovery";
import { CategoryIcon } from "@/components/discovery/category-icon";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group relative flex h-48 items-end overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Background image or gradient fallback */}
      {category.imageUrl ? (
        <img
          src={category.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Icon badge */}
      <span className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
        <CategoryIcon name={category.icon} className="size-4" />
      </span>

      {/* Arrow */}
      <ArrowUpRight
        className="absolute right-3 bottom-3 size-4 text-white/60 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
        aria-hidden
      />

      {/* Text content */}
      <div className="relative z-10 p-5">
        <h3 className="font-heading text-lg font-semibold text-white">
          {category.name}
        </h3>
        <p className="mt-0.5 text-sm text-white/80">
          {category.businessCount}{" "}
          {category.businessCount === 1 ? "business" : "businesses"}
        </p>
      </div>
    </Link>
  );
}
