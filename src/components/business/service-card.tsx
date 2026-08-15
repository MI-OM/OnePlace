import { Clock } from "lucide-react";

import type { BusinessService } from "@/lib/business";
import { formatDuration, priceLabel } from "@/lib/format";

export function ServiceCard({ service }: { service: BusinessService }) {
  const duration = formatDuration(service.durationMinutes);

  return (
    <li className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-medium">{service.name}</h4>
        <span className="shrink-0 text-sm font-medium text-primary">
          {priceLabel(service)}
        </span>
      </div>
      {service.description && (
        <p className="text-sm text-muted-foreground">{service.description}</p>
      )}
      {duration && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" aria-hidden />
          {duration}
        </p>
      )}
    </li>
  );
}
