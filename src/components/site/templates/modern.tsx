import type { TemplateProps } from "./types";

const DayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function stars(rating: number | null): string {
  if (rating === null) return "☆☆☆☆☆";
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function formatPrice(
  price: number,
  priceType: string,
  minPrice: number | null,
  maxPrice: number | null,
  currency: string,
): string {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  switch (priceType) {
    case "fixed":
      return fmt.format(price);
    case "starting_from":
      return `From ${fmt.format(price)}`;
    case "range":
      if (minPrice != null && maxPrice != null) {
        return `${fmt.format(minPrice)} – ${fmt.format(maxPrice)}`;
      }
      return fmt.format(price);
    case "quote_required":
      return "Contact for pricing";
    default:
      return fmt.format(price);
  }
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return m === 0 ? `${hour} ${period}` : `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export type ModernTemplateProps = TemplateProps & {
  photos?: { url: string; alt_text: string | null }[];
};

export default function ModernTemplate({
  business: b,
  photos,
}: ModernTemplateProps) {
  const today = new Date().getDay();

  const sortedHours = [...b.hours].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek,
  );

  const primary = b.websitePrimaryColor || "#1e293b";
  const accent = b.websiteAccentColor || "#f59e0b";

  return (
    <div
      style={{ "--primary": primary, "--accent": accent } as React.CSSProperties}
      className="min-h-screen bg-white text-slate-800 antialiased"
    >
      {/* ─── Hero Split ─── */}
      <section className="relative">
        <div className="mx-auto grid min-h-[520px] max-w-7xl grid-cols-1 md:grid-cols-2">
          <div
            className="flex flex-col items-start justify-center px-8 py-16 md:px-16 md:py-24"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {b.logoUrl && (
              <img
                src={b.logoUrl}
                alt={`${b.name} logo`}
                className="mb-8 h-20 w-20 rounded-2xl object-cover shadow-lg"
              />
            )}
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              {b.name}
            </h1>
            {b.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {b.categories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-block rounded-full px-4 py-1.5 text-sm font-medium text-white/90"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--accent) 40%, transparent)",
                    }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            {b.rating !== null && (
              <div className="mt-6 flex items-center gap-3">
                <span className="text-lg tracking-wide text-amber-400">
                  {stars(b.rating)}
                </span>
                <span className="text-sm font-medium text-white/80">
                  {b.rating.toFixed(1)} ({b.reviewCount}{" "}
                  {b.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </div>

          {b.coverImageUrl && (
            <div className="relative min-h-[300px] md:min-h-0">
              <img
                src={b.coverImageUrl}
                alt={b.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 hidden md:block"
                style={{
                  background: `linear-gradient(90deg, var(--primary) 0%, transparent 25%)`,
                }}
              />
              <div
                className="absolute inset-0 md:hidden"
                style={{
                  background: `linear-gradient(180deg, var(--primary) 0%, transparent 30%)`,
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* ─── About + Stats ─── */}
      <section style={{ backgroundColor: "var(--primary)" }}>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-8 py-20 md:grid-cols-5 md:px-16">
          <div className="md:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
              About Us
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-white/85">
              {b.description || "We are a trusted local business committed to quality and customer satisfaction."}
            </p>
          </div>
          <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:gap-6">
            <div className="flex-1 rounded-2xl p-6 text-center" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
              <div className="text-3xl font-bold text-white">{b.reviewCount}</div>
              <div className="mt-1 text-sm text-white/60">Reviews</div>
            </div>
            <div className="flex-1 rounded-2xl p-6 text-center" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
              <div className="text-3xl font-bold text-white">
                {b.rating !== null ? b.rating.toFixed(1) : "—"}
              </div>
              <div className="mt-1 text-sm text-white/60">Rating</div>
            </div>
            <div className="flex-1 rounded-2xl p-6 text-center" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)" }}>
              {b.foundedYear && (
                <div className="text-3xl font-bold text-white">
                  {new Date().getFullYear() - b.foundedYear}+
                </div>
                <div className="mt-1 text-sm text-white/60">Years</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Services ─── */}
      {b.services.length > 0 && (
        <section className="mx-auto max-w-7xl px-8 py-20 md:px-16">
          <h2
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Our Services
          </h2>
          <div className="mt-3 text-3xl font-bold tracking-tight">What We Offer</div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {b.services.map((s) => (
              <div
                key={s.id}
                className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                style={{ borderLeftWidth: "4px", borderLeftColor: "var(--accent)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-slate-900">{s.name}</h3>
                  {s.price != null && (
                    <span className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-white" style={{ backgroundColor: "var(--primary)" }}>
                      {formatPrice(s.price, s.priceType, s.minPrice, s.maxPrice, s.currency)}
                    </span>
                  )}
                </div>
                {s.description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">{s.description}</p>
                )}
                {s.durationMinutes != null && (
                  <p className="mt-3 text-xs text-slate-400">Duration: {s.durationMinutes} min</p>
                )}
              </div>
            ))}
          </div>
        </section>
)}
             
            {/* ─── Products ─── */}
            {b.products && b.products.length > 0 && (
              <section className="px-8 py-20 md:px-16" style={{ backgroundColor: "color-mix(in srgb, var(--accent) 5%, white)" }}>
                <div className="mx-auto max-w-7xl">
                  <h2 className="text-sm font-semibold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                    Our Products
                  </h2>
                  <div className="mt-3 text-3xl font-bold tracking-tight">What We Offer</div>
                  <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {b.products.map((p) => (
                      <div
                        key={p.id}
                        className="group relative overflow-hidden rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        style={{ borderLeftWidth: "4px", borderLeftColor: "var(--accent)" }}
                      >
                        {p.imageUrl && (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-32 w-full object-cover rounded-t-xl"
                          />
                        )}
                        <div className="p-3">
                          <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
                          {p.price != null && (
                            <span className="shrink-0 rounded-full px-3 py-1 text-sm font-medium text-white" style={{ backgroundColor: "var(--primary)" }}>
                              {formatPrice(p.price, p.priceType, p.minPrice, p.maxPrice, p.currency)}
                            </span>
                          )}
                          {p.description && (
                            <p className="mt-1 text-sm leading-relaxed text-slate-500">{p.description}</p>
                          )}
                          {p.url && (
                            <a
                              href={p.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block text-primary underline underline-offset-2 hover:text-primary/90"
                            >
                              View product
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {photos && photos.length > 0 && (
        <section
          className="px-8 py-20 md:px-16"
          style={{ backgroundColor: "color-mix(in srgb, var(--primary) 5%, white)" }}
        >
          <div className="mx-auto max-w-7xl">
            <h2
              className="text-sm font-semibold uppercase tracking-widest"
              style={{ color: "var(--accent)" }}
            >
              Gallery
            </h2>
            <div className="mt-3 text-3xl font-bold tracking-tight">Our Space</div>
            <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
              {photos.map((p, i) => (
                <div
                  key={i}
                  className={`relative overflow-hidden rounded-xl ${
                    i % 5 === 0
                      ? "col-span-2 row-span-2"
                      : i % 3 === 0
                        ? "col-span-1 row-span-2"
                        : ""
                  }`}
                >
                  <img
                    src={p.url}
                    alt={p.alt_text || b.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    style={{ minHeight: i % 5 === 0 ? "320px" : "200px" }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Testimonials ─── */}
      {b.reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-8 py-20 md:px-16">
          <h2
            className="text-sm font-semibold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            Testimonials
          </h2>
          <div className="mt-3 text-3xl font-bold tracking-tight">What People Say</div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {b.reviews.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="relative rounded-2xl bg-slate-50 p-8"
              >
                <span
                  className="absolute left-6 top-4 text-6xl leading-none"
                  style={{ color: "var(--accent)", fontFamily: "Georgia, serif" }}
                  aria-hidden
                >
                  &ldquo;
                </span>
                <div className="relative mt-6">
                  <div className="text-xs text-amber-500">{stars(r.rating)}</div>
                  {r.title && (
                    <div className="mt-2 font-semibold text-slate-800">{r.title}</div>
                  )}
                  {r.body && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.body}</p>
                  )}
                  <div className="mt-4 text-xs font-medium text-slate-400">
                    {r.reviewerName || "Anonymous"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Hours + Contact ─── */}
      <section style={{ backgroundColor: "var(--primary)" }}>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-8 py-20 md:grid-cols-2 md:px-16">
          {/* Hours */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
              Business Hours
            </h2>
            <div className="mt-6 space-y-0 overflow-hidden rounded-2xl bg-white/10">
              {sortedHours.map((h, i) => {
                const isToday = h.dayOfWeek === today;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-6 py-3.5 text-sm ${
                      isToday ? "font-semibold text-white" : "text-white/70"
                    }`}
                    style={
                      isToday
                        ? {
                            backgroundColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
                          }
                        : i % 2 === 0
                          ? { backgroundColor: "rgba(255,255,255,0.03)" }
                          : undefined
                    }
                  >
                    <span>{DayNames[h.dayOfWeek]}</span>
                    <span>
                      {h.isClosed
                        ? "Closed"
                        : `${formatTime(h.opensAt!)} – ${formatTime(h.closesAt!)}`}
                    </span>
                    {isToday && (
                      <span
                        className="ml-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: "var(--accent)", color: "var(--primary)" }}
                      >
                        Today
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
              Get In Touch
            </h2>
            <div className="mt-6 space-y-6">
              {b.phone && (
                <a
                  href={`tel:${b.phone}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white/10 p-6 transition-colors hover:bg-white/15"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl text-lg text-white" style={{ backgroundColor: "var(--accent)" }}>
                    &#9742;
                  </span>
                  <div>
                    <div className="text-xs text-white/50">Phone</div>
                    <div className="text-lg font-semibold text-white transition-colors group-hover:underline">
                      {b.phone}
                    </div>
                  </div>
                </a>
              )}
              {b.email && (
                <a
                  href={`mailto:${b.email}`}
                  className="group flex items-center gap-4 rounded-2xl bg-white/10 p-6 transition-colors hover:bg-white/15"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl text-lg text-white" style={{ backgroundColor: "var(--accent)" }}>
                    &#9993;
                  </span>
                  <div>
                    <div className="text-xs text-white/50">Email</div>
                    <div className="text-lg font-semibold text-white transition-colors group-hover:underline">
                      {b.email}
                    </div>
                  </div>
                </a>
              )}
              {b.websiteUrl && (
                <a
                  href={b.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 rounded-2xl bg-white/10 p-6 transition-colors hover:bg-white/15"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl text-lg text-white" style={{ backgroundColor: "var(--accent)" }}>
                    &#127760;
                  </span>
                  <div>
                    <div className="text-xs text-white/50">Website</div>
                    <div className="text-lg font-semibold text-white transition-colors group-hover:underline">
                      {b.websiteUrl.replace(/^https?:\/\//, "")}
                    </div>
                  </div>
                </a>
              )}
              {b.addressLine1 && (
                <div className="flex items-start gap-4 rounded-2xl bg-white/10 p-6">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg text-white" style={{ backgroundColor: "var(--accent)" }}>
                    &#9873;
                  </span>
                  <div>
                    <div className="text-xs text-white/50">Address</div>
                    <div className="text-lg font-semibold text-white">
                      {b.addressLine1}
                    </div>
                    <div className="text-sm text-white/60">
                      {[b.city, b.province, b.postalCode, b.country]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-8 py-8 text-sm text-slate-400 md:flex-row md:px-16">
          <span className="font-medium text-slate-600">{b.name}</span>
          <a
            href="/"
            className="underline underline-offset-2 text-primary hover:text-primary/90"
          >
            Powered by OnePlace
          </a>
        </div>
      </footer>
    </div>
  );
}
