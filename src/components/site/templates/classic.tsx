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

type ClassicTemplateProps = TemplateProps & {
  photos?: { url: string; alt_text: string | null }[];
};

function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <span aria-label={`${rating} out of 5 stars`} className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color }} aria-hidden="true">
          {i <= rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

function SectionHeading({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        {children}
      </h2>
      <div
        className="mx-auto mt-3 h-1 w-16 rounded-full"
        style={{ backgroundColor: accent }}
      />
    </div>
  );
}

export default function ClassicTemplate({
  business,
  photos,
}: ClassicTemplateProps) {
  const primary = business.websitePrimaryColor || "#2563eb";
  const accent = business.websiteAccentColor || "#f59e0b";

  const today = new Date().getDay();

  const sortedHours = [...business.hours].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek,
  );

  const formatPrice = (price: number, currency?: string) =>
    new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currency || "CAD",
    }).format(price);

  const formatPriceLabel = (
    price: number | null,
    priceType: string,
    currency?: string,
  ) => {
    if (price === null) return null;
    const formatted = formatPrice(price, currency);
    switch (priceType) {
      case "starting_from":
        return `From ${formatted}`;
      case "range":
        return `${formatted}+`;
      default:
        return formatted;
    }
  };

  const reviewerDisplayName = (review: {
    reviewerName: string | null;
  }) => {
    return review.reviewerName || "Anonymous";
  };

  const addressParts = [
    business.addressLine1,
    business.city,
    business.province,
    business.postalCode,
    business.country,
  ]
    .filter(Boolean)
    .join(", ");

  const mapsQuery = encodeURIComponent(addressParts);

  return (
    <div
      className="min-h-screen bg-white font-sans text-gray-900 antialiased"
      style={{ "--primary": primary, "--accent": accent } as React.CSSProperties}
    >
      {/* ─── Hero ─── */}
      <section className="relative flex min-h-[480px] items-center overflow-hidden">
        {business.coverImageUrl ? (
          <img
            src={business.coverImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ backgroundColor: primary }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${primary}dd 0%, ${primary}99 50%, ${primary}66 100%)`,
          }}
        />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 text-center">
          {business.logoUrl && (
            <img
              src={business.logoUrl}
              alt={`${business.name} logo`}
              className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-white object-contain p-2 shadow-lg sm:h-24 sm:w-24"
            />
          )}

          <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-5xl lg:text-6xl">
            {business.name}
          </h1>

          {business.categories.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {business.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          {business.rating !== null && (
            <div className="mt-6 flex items-center justify-center gap-2 text-lg">
              <Stars rating={Math.round(business.rating)} color={accent} />
              <span className="font-semibold text-white">
                {business.rating.toFixed(1)}
              </span>
              <span className="text-white/70">
                ({business.reviewCount}{" "}
                {business.reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ─── About ─── */}
      {business.description && (
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <SectionHeading accent={accent}>About</SectionHeading>
            <p className="whitespace-pre-line text-lg leading-relaxed text-gray-600">
              {business.description}
            </p>
          </div>
        </section>
      )}

      {/* ─── Services ─── */}
      {business.services.length > 0 && (
        <section className="bg-gray-50 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading accent={accent}>Services</SectionHeading>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {business.services.map((svc) => {
                const priceLabel = formatPriceLabel(
                  svc.price,
                  svc.priceType,
                  svc.currency,
                );
                return (
                  <div
                    key={svc.id}
                    className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {svc.name}
                    </h3>
                    {svc.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">
                        {svc.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      {priceLabel && (
                        <span
                          className="text-lg font-bold"
                          style={{ color: accent }}
                        >
                          {priceLabel}
                        </span>
                      )}
                      {svc.durationMinutes && (
                        <span className="ml-auto text-xs text-gray-400">
                          {svc.durationMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── Photo Gallery ─── */}
      {photos && photos.length > 0 && (
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading accent={accent}>Gallery</SectionHeading>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square overflow-hidden rounded-xl"
                >
                  <img
                    src={photo.url}
                    alt={photo.alt_text || `${business.name} photo ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Hours ─── */}
      {sortedHours.length > 0 && (
        <section className="bg-gray-50 px-6 py-20">
          <div className="mx-auto max-w-2xl">
            <SectionHeading accent={accent}>Hours</SectionHeading>
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <tbody>
                  {sortedHours.map((row, idx) => {
                    const isToday = row.dayOfWeek === today;
                    return (
                      <tr
                        key={row.dayOfWeek}
                        className={
                          isToday
                            ? "bg-gray-50 font-semibold"
                            : idx !== sortedHours.length - 1
                              ? "border-b border-gray-100"
                              : ""
                        }
                      >
                        <td className="px-5 py-3.5">
                          <span
                            style={isToday ? { color: accent } : undefined}
                          >
                            {DayNames[row.dayOfWeek]}
                          </span>
                          {isToday && (
                            <span
                              className="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                              style={{ backgroundColor: accent }}
                            >
                              Today
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-600">
                          {row.isClosed ? (
                            <span className="text-gray-400">Closed</span>
                          ) : (
                            <span>
                              {row.opensAt} – {row.closesAt}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ─── Reviews ─── */}
      {business.reviews.length > 0 && (
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <SectionHeading accent={accent}>Reviews</SectionHeading>
            <div className="space-y-6">
              {business.reviews.slice(0, 5).map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-gray-100 p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Stars rating={review.rating} color={accent} />
                      {review.title && (
                        <h4 className="mt-2 text-base font-semibold text-gray-900">
                          {review.title}
                        </h4>
                      )}
                    </div>
                    <time
                      dateTime={review.createdAt}
                      className="shrink-0 text-xs text-gray-400"
                    >
                      {new Date(review.createdAt).toLocaleDateString("en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  {review.body && (
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">
                      {review.body}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-medium text-gray-400">
                    — {reviewerDisplayName(review)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Contact ─── */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <SectionHeading accent={accent}>Contact</SectionHeading>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Phone */}
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${primary}15`, color: primary }}
                >
                  📞
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Phone
                  </p>
                  <p className="mt-1 font-semibold text-gray-900 transition-colors group-hover:underline">
                    {business.phone}
                  </p>
                </div>
              </a>
            )}

            {/* Email */}
            {business.email && (
              <a
                href={`mailto:${business.email}`}
                className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${primary}15`, color: primary }}
                >
                  ✉
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Email
                  </p>
                  <p className="mt-1 font-semibold text-gray-900 transition-colors group-hover:underline">
                    {business.email}
                  </p>
                </div>
              </a>
            )}

            {/* Website */}
            {business.websiteUrl && (
              <a
                href={business.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${primary}15`, color: primary }}
                >
                  🌐
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Website
                  </p>
                  <p className="mt-1 font-semibold text-gray-900 transition-colors group-hover:underline">
                    {business.websiteUrl.replace(/^https?:\/\//, "")}
                  </p>
                </div>
              </a>
            )}

            {/* Address */}
            {addressParts && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:col-span-2 lg:col-span-1"
              >
                <span
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${primary}15`, color: primary }}
                >
                  📍
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Address
                  </p>
                  <p className="mt-1 font-semibold text-gray-900 transition-colors group-hover:underline">
                    {business.addressLine1}
                    <br />
                    {[business.city, business.province, business.postalCode]
                      .filter(Boolean)
                      .join(", ")}
                    {business.country && <br />}
                    {business.country}
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold text-gray-800">
            {business.name}
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Powered by{" "}
            <a
              href="/"
              className={primary}
              style={{ color: primary }}
              className="font-medium"
            >
              OnePlace
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
