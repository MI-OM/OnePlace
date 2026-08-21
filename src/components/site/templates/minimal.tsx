import type { TemplateProps } from "./types";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const TODAY = new Date().getDay();

function stars(rating: number) {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
}

function formatPrice(
  price: number,
  priceType: string,
  minPrice: number | null,
  maxPrice: number | null,
  currency: string,
) {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (priceType === "quote_required") return "Quote";
  if (priceType === "starting_from") return `From ${fmt.format(price)}`;
  if (priceType === "range" && minPrice != null && maxPrice != null)
    return `${fmt.format(minPrice)} – ${fmt.format(maxPrice)}`;
  return fmt.format(price);
}

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export default function MinimalTemplate({
  business: b,
  photos,
}: TemplateProps & { photos?: { url: string; alt_text: string | null }[] }) {
  const address = [b.addressLine1, b.city, b.province, b.postalCode, b.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="min-h-screen bg-white text-neutral-900 antialiased"
      style={{ "--primary": b.websitePrimaryColor, "--accent": b.websiteAccentColor } as React.CSSProperties}
    >
      {/* Header */}
      <header className="flex flex-col items-center px-6 pt-20 pb-16 text-center">
        {b.logoUrl && (
          <img
            src={b.logoUrl}
            alt={`${b.name} logo`}
            className="mb-6 h-20 w-20 rounded-full object-cover shadow-sm"
          />
        )}
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl" style={{ color: "var(--primary)" }}>
          {b.name}
        </h1>
        {b.categories.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {b.categories.map((c) => (
              <span
                key={c.id}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium tracking-wide text-neutral-500"
              >
                {c.name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-6 flex items-center gap-2 text-sm text-neutral-500">
          {b.rating != null && (
            <>
              <span className="text-base tracking-wide" style={{ color: "var(--primary)" }}>
                {stars(b.rating)}
              </span>
              <span>
                {b.rating.toFixed(1)} ({b.reviewCount})
              </span>
            </>
          )}
        </div>
      </header>

      {/* Cover */}
      {b.coverImageUrl && (
        <div className="mx-auto max-w-5xl px-6 pb-16">
          <img
            src={b.coverImageUrl}
            alt={b.name}
            className="w-full rounded-2xl object-cover shadow-sm"
            style={{ maxHeight: 420 }}
          />
        </div>
      )}

      {/* About */}
      {b.description && (
        <section className="mx-auto max-w-2xl px-6 pb-20 text-center">
          <p className="text-lg leading-relaxed text-neutral-600">{b.description}</p>
        </section>
      )}

      {/* Services */}
      {b.services.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 pb-20">
          <h2 className="mb-8 text-center font-serif text-2xl font-semibold tracking-tight">Services</h2>
          <div className="divide-y divide-neutral-100">
            {b.services.map((s) => (
              <div key={s.id} className="flex items-baseline justify-between py-4">
                <div>
                  <span className="font-medium text-neutral-800">{s.name}</span>
                  {s.description && (
                    <span className="ml-2 text-sm text-neutral-400">{s.description}</span>
                  )}
                </div>
                <span className="ml-4 shrink-0 font-medium" style={{ color: "var(--accent)" }}>
                  {formatPrice(s.price ?? 0, s.priceType, s.minPrice, s.maxPrice, s.currency)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Photo Gallery */}
      {photos && photos.length > 0 && (
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <h2 className="mb-8 text-center font-serif text-2xl font-semibold tracking-tight">Gallery</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {photos.map((p, i) => (
              <img
                key={i}
                src={p.url}
                alt={p.alt_text ?? b.name}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </section>
      )}

      {/* Hours */}
      {b.hours.length > 0 && (
        <section className="mx-auto max-w-md px-6 pb-20">
          <h2 className="mb-8 text-center font-serif text-2xl font-semibold tracking-tight">Hours</h2>
          <div className="space-y-0 divide-y divide-neutral-100">
            {DAY_NAMES.map((day, i) => {
              const row = b.hours.find((h) => h.dayOfWeek === i);
              const isToday = i === TODAY;
              return (
                <div
                  key={day}
                  className={`flex items-center justify-between py-3 text-sm ${isToday ? "font-semibold" : "text-neutral-500"}`}
                >
                  <span style={isToday ? { color: "var(--primary)" } : undefined}>{day}</span>
                  <span style={isToday ? { color: "var(--primary)" } : undefined}>
                    {row?.isClosed || !row?.opensAt || !row?.closesAt
                      ? "Closed"
                      : `${formatTime(row.opensAt)} – ${formatTime(row.closesAt)}`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

            {/* ─── Products ─── */}
            {b.products && b.products.length > 0 && (
              <section className="mx-auto max-w-5xl px-6 pb-20">
                <h2 className="mb-8 text-center font-serif text-2xl font-semibold tracking-tight">Our Products</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {b.products.map((p) => (
                    <div key={p.id} className="border rounded p-4">
                      {p.imageUrl && (
                        <img src={p.imageUrl} alt={p.name} className="h-32 w-full object-cover rounded-t" />
                      )}
                      <div className="p-3">
                        <h3 className="font-semibold">{p.name}</h3>
                        {p.price != null && (
                          <p className="mt-2 font-medium">{formatPrice(p.price, p.priceType, p.minPrice, p.maxPrice, p.currency)}</p>
                        )}
                        {p.description && (
                          <p className="mt-2 text-sm text-neutral-600">{p.description}</p>
                        )}
                        {p.url && (
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block text-primary underline underline-offset-2 hover:text-primary/90"
                          >
                            View product
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
      {b.reviews.length > 0 && (
        <section className="mx-auto max-w-2xl px-6 pb-20">
          <h2 className="mb-8 text-center font-serif text-2xl font-semibold tracking-tight">Reviews</h2>
          <div className="space-y-10">
            {b.reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="text-center">
                <span className="text-base tracking-wide" style={{ color: "var(--primary)" }}>
                  {stars(r.rating)}
                </span>
                {r.body && (
                  <blockquote className="mt-3 text-base italic leading-relaxed text-neutral-600">
                    &ldquo;{r.body}&rdquo;
                  </blockquote>
                )}
                {r.reviewerName && (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    {r.reviewerName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="mx-auto max-w-2xl px-6 pb-20 text-center">
        <h2 className="mb-8 font-serif text-2xl font-semibold tracking-tight">Contact</h2>
        <div className="flex flex-col items-center gap-3 text-neutral-600">
          {b.phone && (
            <a href={`tel:${b.phone}`} className="transition-colors hover:underline" style={{ color: "var(--primary)" }}>
              {b.phone}
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} className="transition-colors hover:underline" style={{ color: "var(--primary)" }}>
              {b.email}
            </a>
          )}
          {b.websiteUrl && (
            <a
              href={b.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:underline"
              style={{ color: "var(--primary)" }}
            >
              {b.websiteUrl.replace(/^https?:\/\//, "")}
            </a>
          )}
          {address && <p className="mt-2 text-sm text-neutral-400">{address}</p>}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100 py-8 text-center text-xs text-neutral-400">
        {b.name} &middot; <a href="/" className="underline underline-offset-2 text-primary hover:text-primary/90">Powered by OnePlace</a>
      </footer>
    </div>
  );
}
