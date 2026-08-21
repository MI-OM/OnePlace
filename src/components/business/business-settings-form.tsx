"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  updateBusinessProfile,
  updateBusinessAIConfig,
  updateBusinessHours,
  updateBusinessServices,
  updateBusinessImages,
  updateBusinessWebsite,
} from "@/lib/business/settings-actions";
import { Button } from "@/components/ui/button";
import { ImageUpload, GalleryUpload, type GalleryPhoto } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QrCodeSection } from "@/components/business/qr-code-section";

type Tab = "profile" | "images" | "ai" | "hours" | "services" | "website";

const TABS: { id: Tab; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "images", label: "Images" },
  { id: "ai", label: "AI Assistant" },
  { id: "hours", label: "Hours" },
  { id: "services", label: "Services" },
  { id: "website", label: "Website" },
  { id: "products", label: "Products" },
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Props = {
  businessId: string;
  business: {
    name: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    websiteUrl: string | null;
    addressLine1: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    foundedYear: number | null;
    slug: string;
    websiteTemplate: string;
    websitePrimaryColor: string;
    websiteAccentColor: string;
  };
  hours: { day: number; isClosed: boolean; opensAt: string | null; closesAt: string | null }[];
  services: { id: string; name: string; description: string | null; price: number | null; priceType: string | null; minPrice: number | null; maxPrice: number | null; durationMinutes: number | null }[];
  aiConfig: { greeting: string | null; personality: string | null; handoffEnabled: boolean; escalationEnabled: boolean; voiceEnabled: boolean } | null;
  photos?: { id: string; url: string; altText: string | null; sortOrder: number }[];
};

export function BusinessSettingsForm({
  businessId,
  business,
  hours: initialHours,
  services: initialServices,
  aiConfig: initialAI,
  photos: initialPhotos = [],
}: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const [pending, startTransition] = useTransition();

  // Profile state
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? "");
  const [phone, setPhone] = useState(business.phone ?? "");
  const [email, setEmail] = useState(business.email ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(business.websiteUrl ?? "");
  const [addressLine1, setAddressLine1] = useState(business.addressLine1 ?? "");
  const [city, setCity] = useState(business.city ?? "");
  const [province, setProvince] = useState(business.province ?? "");
  const [postalCode, setPostalCode] = useState(business.postalCode ?? "");
  const [foundedYear, setFoundedYear] = useState<number | null>(business.foundedYear ?? null);

  // AI config state
  const [greeting, setGreeting] = useState(initialAI?.greeting ?? "");
  const [personality, setPersonality] = useState(initialAI?.personality ?? "friendly");
  const [handoffEnabled, setHandoffEnabled] = useState(initialAI?.handoffEnabled ?? true);
  const [escalationEnabled, setEscalationEnabled] = useState(initialAI?.escalationEnabled ?? true);
  const [voiceEnabled, setVoiceEnabled] = useState(initialAI?.voiceEnabled ?? false);

  // Hours state
  const [hours, setHours] = useState(() => {
    const map = new Map(initialHours.map((h) => [h.day, h]));
    return Array.from({ length: 7 }, (_, i) => ({
      day: i,
      isClosed: map.get(i)?.isClosed ?? (i === 0),
      opensAt: map.get(i)?.opensAt ?? "09:00",
      closesAt: map.get(i)?.closesAt ?? "17:00",
    }));
  });

  // Services state
  const [services, setServices] = useState(() =>
    initialServices.map((s) => ({ ...s, _key: s.id || crypto.randomUUID() })),
  );
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Images state
  const [logoUrl, setLogoUrl] = useState(business.logoUrl);
  const [coverImageUrl, setCoverImageUrl] = useState(business.coverImageUrl);
  const [photos, setPhotos] = useState<GalleryPhoto[]>(
    initialPhotos.map((p) => ({ url: p.url, altText: p.altText ?? "", sortOrder: p.sortOrder })),
  );

  // Website config state
  const [websiteTemplate, setWebsiteTemplate] = useState(business.websiteTemplate);
  const [websitePrimaryColor, setWebsitePrimaryColor] = useState(business.websitePrimaryColor);
  const [websiteAccentColor, setWebsiteAccentColor] = useState(business.websiteAccentColor);
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [productPrice, setProductPrice] = useState(0);
  const [productPriceType, setProductPriceType] = useState<"fixed" | "starting_from" | "range" | "quote_required">("fixed");
  const [productProductType, setProductProductType] = useState<"product" | "digital" | "gift_card" | "service_addon">("product");
  const [productSortOrder, setProductSortOrder] = useState(0);
  const [productIsActive, setProductIsActive] = useState(true);

  const handleSaveProfile = () => {
    startTransition(async () => {
      const result = await updateBusinessProfile(businessId, {
        name, description, phone, email, websiteUrl, addressLine1, city, province, postalCode,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Profile updated.");
      }
    });
  };

  const handleSaveAI = () => {
    startTransition(async () => {
      const result = await updateBusinessAIConfig(businessId, {
        greeting, personality, handoffEnabled, escalationEnabled, voiceEnabled,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("AI settings updated.");
      }
    });
  };

  const handleSaveImages = () => {
    startTransition(async () => {
      const result = await updateBusinessImages(businessId, {
        logoUrl: logoUrl ?? null,
        coverImageUrl: coverImageUrl ?? null,
        photos: photos.map((p, i) => ({ url: p.url, altText: p.altText, sortOrder: i })),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Images updated.");
      }
    });
  };

  const handleSaveHours = () => {
    startTransition(async () => {
      const result = await updateBusinessHours(businessId, { hours });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Hours updated.");
      }
    });
  };

  const handleSaveServices = () => {
    startTransition(async () => {
      const result = await updateBusinessServices(businessId, {
        services: services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? undefined,
          price: s.price ?? undefined,
          priceType: s.priceType ?? undefined,
          minPrice: s.minPrice ?? undefined,
          maxPrice: s.maxPrice ?? undefined,
          durationMinutes: s.durationMinutes ?? undefined,
        })),
        deletedIds,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Services updated.");
        setDeletedIds([]);
      }
    });
  };

  const handleSaveWebsite = () => {
    startTransition(async () => {
      const result = await updateBusinessWebsite(businessId, {
        template: websiteTemplate as "classic" | "modern" | "minimal",
        primaryColor: websitePrimaryColor,
        accentColor: websiteAccentColor,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Website settings updated.");
      }
    });
  };

  const handleSaveProducts = () => {
    startTransition(async () => {
      const result = await updateBusinessProducts(businessId, {
        productName,
        productUrl,
        productPrice,
        productPriceType,
        productProductType,
        productSortOrder,
        productIsActive,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Products updated.");
      }
    });
  };

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {tab === "profile" && (
          <>
            <Field label="Business name" value={name} onChange={setName} />
            <Field label="Description" value={description} onChange={setDescription} textarea />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone" value={phone} onChange={setPhone} />
              <Field label="Email" value={email} onChange={setEmail} />
            </div>
            <Field label="Website" value={websiteUrl} onChange={setWebsiteUrl} />
            <Field label="Address" value={addressLine1} onChange={setAddressLine1} />
            <div className="grid grid-cols-3 gap-4">
              <Field label="City" value={city} onChange={setCity} />
              <Field label="Province" value={province} onChange={setProvince} />
              <Field label="Founded year" value={foundedYear} onChange={setFoundedYear} />
              <Field label="Postal code" value={postalCode} onChange={setPostalCode} />
            </div>
            <Button onClick={handleSaveProfile} disabled={pending}>
              {pending ? "Saving..." : "Save profile"}
            </Button>
          </>
        )}

        {tab === "images" && (
          <>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <ImageUpload
                  bucket="business-images"
                  path={`${businessId}/logo`}
                  value={logoUrl}
                  onChange={setLogoUrl}
                  label="Logo"
                />
                <ImageUpload
                  bucket="business-images"
                  path={`${businessId}/cover`}
                  value={coverImageUrl}
                  onChange={setCoverImageUrl}
                  label="Cover photo"
                  className="sm:col-span-2"
                />
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-foreground">Gallery photos</p>
                <GalleryUpload
                  bucket="business-images"
                  basePath="gallery"
                  businessId={businessId}
                  photos={photos}
                  onChange={setPhotos}
                />
              </div>
            </div>
            <Button onClick={handleSaveImages} disabled={pending}>
              {pending ? "Saving..." : "Save images"}
            </Button>
          </>
        )}

        {tab === "ai" && (
          <>
            <Field label="Welcome message" value={greeting} onChange={setGreeting} textarea placeholder="What customers see when a chat starts" />
            <Field label="Personality" value={personality} onChange={setPersonality} placeholder="friendly, professional, casual" />
            <div className="space-y-3">
              <Toggle label="Allow human handoff" checked={handoffEnabled} onChange={setHandoffEnabled} description="Let customers request a real person" />
              <Toggle label="Enable escalation" checked={escalationEnabled} onChange={setEscalationEnabled} description="Escalate when AI can't answer" />
              <Toggle label="Enable voice conversations" checked={voiceEnabled} onChange={setVoiceEnabled} description="Let customers talk instead of type. Voice sessions are not recorded." />
            </div>
            <Button onClick={handleSaveAI} disabled={pending}>
              {pending ? "Saving..." : "Save AI settings"}
            </Button>
          </>
        )}

        {tab === "hours" && (
          <>
            <div className="space-y-3">
              {hours.map((entry) => (
                <div key={entry.day} className="flex items-center gap-3">
                  <span className="w-28 text-sm font-medium">{DAY_NAMES[entry.day]}</span>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={entry.isClosed}
                      onChange={(e) =>
                        setHours((prev) =>
                          prev.map((h) =>
                            h.day === entry.day ? { ...h, isClosed: e.target.checked } : h,
                          ),
                        )
                      }
                      className="size-4 accent-primary"
                    />
                    Closed
                  </label>
                  {!entry.isClosed && (
                    <>
                      <input
                        type="time"
                        value={entry.opensAt}
                        onChange={(e) =>
                          setHours((prev) =>
                            prev.map((h) =>
                              h.day === entry.day ? { ...h, opensAt: e.target.value } : h,
                            ),
                          )
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                      />
                      <span className="text-sm text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={entry.closesAt}
                        onChange={(e) =>
                          setHours((prev) =>
                            prev.map((h) =>
                              h.day === entry.day ? { ...h, closesAt: e.target.value } : h,
                            ),
                          )
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={handleSaveHours} disabled={pending}>
              {pending ? "Saving..." : "Save hours"}
            </Button>
          </>
        )}

        {tab === "services" && (
          <>
            <div className="space-y-4">
              {services.map((svc, idx) => (
                <div key={svc._key} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Service {idx + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (svc.id) setDeletedIds((prev) => [...prev, svc.id]);
                        setServices((prev) => prev.filter((_, i) => i !== idx));
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <Field label="Name" value={svc.name} onChange={(v) =>
                    setServices((prev) => prev.map((s, i) => i === idx ? { ...s, name: v } : s))
                  } />
                  <Field label="Description" value={svc.description ?? ""} onChange={(v) =>
                    setServices((prev) => prev.map((s, i) => i === idx ? { ...s, description: v } : s))
                  } textarea />
                  <div className="grid grid-cols-4 gap-3">
                    <Field label="Price" value={String(svc.price ?? "")} onChange={(v) =>
                      setServices((prev) => prev.map((s, i) => i === idx ? { ...s, price: v ? Number(v) : null } : s))
                    } type="number" />
                    <div className="grid gap-1.5">
                      <Label className="text-sm">Price type</Label>
                      <select
                        value={svc.priceType ?? "fixed"}
                        onChange={(e) =>
                          setServices((prev) => prev.map((s, i) => i === idx ? { ...s, priceType: e.target.value } : s))
                        }
                        className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                      >
                        <option value="fixed">Fixed</option>
                        <option value="starting_from">Starting from</option>
                        <option value="range">Range</option>
                        <option value="quote_required">Quote required</option>
                      </select>
                    </div>
                    <Field label="Min price" value={String(svc.minPrice ?? "")} onChange={(v) =>
                      setServices((prev) => prev.map((s, i) => i === idx ? { ...s, minPrice: v ? Number(v) : null } : s))
                    } type="number" />
                    <Field label="Duration (min)" value={String(svc.durationMinutes ?? "")} onChange={(v) =>
                      setServices((prev) => prev.map((s, i) => i === idx ? { ...s, durationMinutes: v ? Number(v) : null } : s))
                    } type="number" />
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={() =>
                setServices((prev) => [...prev, { id: "", name: "", description: null, price: null, priceType: "fixed", minPrice: null, maxPrice: null, durationMinutes: null, _key: crypto.randomUUID() }])
              }>
                + Add service
              </Button>
            </div>
            <Button onClick={handleSaveServices} disabled={pending}>
              {pending ? "Saving..." : "Save services"}
            </Button>
          </>
        )}

        {tab === "website" && (
          <>
            <div className="space-y-6">
              <div>
                <Label className="text-sm">Template</Label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {(["classic", "modern", "minimal"] as const).map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setWebsiteTemplate(tpl)}
                      className={`rounded-lg border-2 p-4 text-center text-sm font-medium transition-colors ${
                        websiteTemplate === tpl
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-muted-foreground"
                      }`}
                    >
                      {tpl.charAt(0).toUpperCase() + tpl.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-sm">Primary color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={websitePrimaryColor}
                      onChange={(e) => setWebsitePrimaryColor(e.target.value)}
                      className="size-9 cursor-pointer rounded-md border border-border"
                    />
                    <Input
                      value={websitePrimaryColor}
                      onChange={(e) => setWebsitePrimaryColor(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-sm">Accent color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={websiteAccentColor}
                      onChange={(e) => setWebsiteAccentColor(e.target.value)}
                      className="size-9 cursor-pointer rounded-md border border-border"
                    />
                    <Input
                      value={websiteAccentColor}
                      onChange={(e) => setWebsiteAccentColor(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSaveWebsite} disabled={pending}>
                  {pending ? "Saving..." : "Save website settings"}
                </Button>
                <Button
                  variant="outline"
                  render={<a href={`/site/${business.slug}`} target="_blank" rel="noopener noreferrer" />}
                >
                  Preview website
                </Button>
              </div>

              <QrCodeSection businessSlug={business.slug} />
            </div>
</>
        )}
        
        {tab === "products" && (
          <>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground mb-4">Add products that will appear on your generated website.</p>
              <div className="rounded-lg border border-border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Product name" value={productName} onChange={setProductName} />
                  <Field label="External URL" value={productUrl} onChange={setProductUrl} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Price" value={String(productPrice ?? "")} onChange={(v) =>
                    setProductPrice(v ? Number(v) : null)}
                  />
                  <Field label="Price type" 
                    select 
                      selectedValue={productPriceType} 
                      onValueChange={(v) => setProductPriceType(v)}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="starting_from">Starting from</option>
                    <option value="range">Range</option>
                    <option value="quote_required">Quote required</option>
                  </select>
                </div>
                <Field label="Product type" 
                  select 
                    selectedValue={productProductType} 
                    onValueChange={(v) => setProductProductType(v)}
                  >
                    <option value="product">Product</option>
                    <option value="digital">Digital</option>
                    <option value="gift_card">Gift card</option>
                    <option value="service_addon">Service addon</option>
                  </select>
                </Field>
                <Field label="Sort order" value={String(productSortOrder)} onChange={setProductSortOrder} type="number" />
                <Toggle label="Active" checked={productIsActive} onChange={setProductIsActive} />
              </div>
              <Button onClick={handleSaveProducts} disabled={pending}>
                {pending ? "Saving..." : "Save products"}
              </Button>
            </div>
          </>
        )}
      
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm">{label}</Label>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <div>
        <span className="text-sm font-medium">{label}</span>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </label>
  );
}
