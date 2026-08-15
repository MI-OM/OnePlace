import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { Category } from "@/lib/discovery";
import { CategoryIcon } from "@/components/discovery/category-icon";
import { Card } from "@/components/ui/card";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block h-full focus-visible:outline-none"
    >
      <Card className="h-full p-5 transition-colors group-hover:bg-muted/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="flex items-start justify-between gap-2">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CategoryIcon name={category.icon} className="size-5" />
          </span>
          <ArrowUpRight
            className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
        <h3 className="mt-4 font-heading text-base font-medium">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {category.description}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {category.businessCount}{" "}
          {category.businessCount === 1 ? "business" : "businesses"}
        </p>
      </Card>
    </Link>
  );
}
