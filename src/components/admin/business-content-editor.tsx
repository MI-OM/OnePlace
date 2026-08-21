"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

import { updateBusinessContent } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";

type Business = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  address_line1: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  timezone: string;
  founded_year: number | null;
};

export function BusinessContentEditor({ business }: { business: Business }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? "");
  const [phone, setPhone] = useState(business.phone ?? "");
  const [email, setEmail] = useState(business.email ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(business.website_url ?? "");
  const [addressLine1, setAddressLine1] = useState(business.address_line1 ?? "");
  const [city, setCity] = useState(business.city ?? "");
  const [province, setProvince] = useState(business.province ?? "");
  const [postalCode, setPostalCode] = useState(business.postal_code ?? "");
  const [country, setCountry] = useState(business.country ?? "");
  const [timezone, setTimezone] = useState(business.timezone ?? "America/St_Johns");
  const [foundedYear, setFoundedYear] = useState(business.founded_year != null ? String(business.founded_year) : "");

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBusinessContent(business.id, {
        name,
        description: description || undefined,
        phone: phone || undefined,
        email: email || undefined,
        websiteUrl: websiteUrl || undefined,
        addressLine1: addressLine1 || undefined,
        city: city || undefined,
        province: province || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
        timezone,
        foundedYear: foundedYear ? Number(foundedYear) : null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Business updated.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-1.5 size-4" aria-hidden />
        Back
      </Button>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" value={name} onChange={setName} />
        <Field label="Timezone" value={timezone} onChange={setTimezone} />
      </div>

      <Field label="Description" value={description} onChange={setDescription} textarea />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" value={phone} onChange={setPhone} />
        <Field label="Email" value={email} onChange={setEmail} />
      </div>

      <Field label="Website URL" value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://..." />

      <Field label="Address line 1" value={addressLine1} onChange={setAddressLine1} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" value={city} onChange={setCity} />
        <Field label="Province" value={province} onChange={setProvince} />
        <Field label="Postal code" value={postalCode} onChange={setPostalCode} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country" value={country} onChange={setCountry} />
        <Field label="Founded year" value={foundedYear} onChange={setFoundedYear} type="number" />
      </div>

      <Button onClick={handleSave} disabled={pending} className="w-full sm:w-auto">
        <Save className="mr-1.5 size-4" aria-hidden />
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  textarea?: boolean;
}) {
  if (textarea) {
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5">{label}</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    );
  }
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
  );
}
