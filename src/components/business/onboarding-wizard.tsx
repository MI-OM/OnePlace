"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Dumbbell,
  Heart,
  Home,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";

import { createBusinessOnboarding } from "@/lib/business/onboarding";
import type { CatalogCategory, CatalogService } from "@/lib/business";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Step = "business" | "services" | "hours" | "ai_config";

const STEPS: Step[] = ["business", "services", "hours", "ai_config"];

const STEP_LABELS: Record<Step, string> = {
  business: "Business details",
  services: "Services",
  hours: "Hours",
  ai_config: "AI assistant",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const CATEGORY_ICONS: Record<string, typeof Sparkles> = {
  sparkles: Sparkles,
  heart: Heart,
  home: Home,
  scissors: Scissors,
  dumbbell: Dumbbell,
  wrench: Wrench,
};

function CategoryIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return null;
  const Icon = CATEGORY_ICONS[name];
  return Icon ? <Icon className={className} /> : null;
}

type HoursRow = {
  day: (typeof DAYS)[number];
  isClosed: boolean;
  opensAt: string;
  closesAt: string;
};

export default function OnboardingWizard({
  categories,
  services: allServices,
}: {
  categories: CatalogCategory[];
  services: CatalogService[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("business");
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessProvince, setBusinessProvince] = useState("");
  const [businessPostalCode, setBusinessPostalCode] = useState("");

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(),
  );

  const [hours, setHours] = useState<HoursRow[]>([]);
  const [hourDay, setHourDay] = useState<(typeof DAYS)[number]>("Mon");
  const [hourOpensAt, setHourOpensAt] = useState("");
  const [hourClosesAt, setHourClosesAt] = useState("");
  const [hourIsClosed, setHourIsClosed] = useState(false);

  const [tone, setTone] = useState<"friendly" | "professional" | "casual">(
    "friendly",
  );
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [humanEscalation, setHumanEscalation] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const stepIndex = STEPS.indexOf(step);

  const servicesForCategories = useMemo(
    () =>
      allServices.filter(
        (s) => s.categoryId && selectedCategoryIds.has(s.categoryId),
      ),
    [allServices, selectedCategoryIds],
  );

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  }

  function validateBusinessStep(): string | null {
    if (businessName.trim().length < 2) return "Enter your business name.";
    if (businessCity.trim().length < 2) return "Enter your city.";
    if (businessProvince.trim().length < 2) return "Enter your province.";
    return null;
  }

  function validateHoursEntry(): string | null {
    if (hourIsClosed) return null;
    if (!hourOpensAt) return "Enter an opening time (HH:MM).";
    if (!hourClosesAt) return "Enter a closing time (HH:MM).";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hourOpensAt))
      return "Opening time must be in HH:MM format.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hourClosesAt))
      return "Closing time must be in HH:MM format.";
    return null;
  }

  function addHoursEntry() {
    const validationError = validateHoursEntry();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (hours.some((entry) => entry.day === hourDay)) {
      toast.error(`${hourDay} is already added.`);
      return;
    }
    setHours([
      ...hours,
      {
        day: hourDay,
        isClosed: hourIsClosed,
        opensAt: hourIsClosed ? "" : hourOpensAt,
        closesAt: hourIsClosed ? "" : hourClosesAt,
      },
    ]);
    setHourOpensAt("");
    setHourClosesAt("");
    setHourIsClosed(false);
  }

  function removeHoursEntry(index: number) {
    setHours(hours.filter((_, i) => i !== index));
  }

  function next() {
    setError(null);
    if (step === "business") {
      const validationError = validateBusinessStep();
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    if (step === "services") {
      if (selectedCategoryIds.size < 1) {
        setError("Select at least 1 category.");
        return;
      }
    }
    const nextStep = STEPS[stepIndex + 1];
    if (nextStep) setStep(nextStep);
  }

  function back() {
    setError(null);
    const prevStep = STEPS[stepIndex - 1];
    if (prevStep) setStep(prevStep);
  }

  function complete() {
    setError(null);
    startTransition(async () => {
      const selectedServices = allServices
        .filter((s) => selectedServiceIds.has(s.id))
        .map((s) => ({ id: s.id, name: s.name, description: s.description ?? undefined }));

      const result = await createBusinessOnboarding({
        step1: {
          businessName: businessName.trim(),
          businessDescription: businessDescription.trim() || undefined,
          businessAddress: businessAddress.trim() || undefined,
          businessCity: businessCity.trim(),
          businessProvince: businessProvince.trim(),
          businessPostalCode: businessPostalCode.trim() || undefined,
        },
        step2: {
          categoryIds: Array.from(selectedCategoryIds),
          services: selectedServices,
        },
        step3: {
          hours: hours.map((entry) => ({
            day: entry.day,
            isClosed: entry.isClosed,
            opensAt: entry.isClosed ? undefined : entry.opensAt || undefined,
            closesAt: entry.isClosed ? undefined : entry.closesAt || undefined,
          })),
        },
        step4: {
          tone,
          welcomeMessage: welcomeMessage.trim() || undefined,
          fallbackMessage: fallbackMessage.trim() || undefined,
          humanEscalationEnabled: humanEscalation,
          voiceEnabled,
        },
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      toast.success("Your business is live.");
      router.push(result.redirectUrl);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set up your business
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}: {STEP_LABELS[step]}
        </p>
        <ol className="mt-4 flex items-center gap-2" aria-label="Progress">
          {STEPS.map((item, index) => (
            <li
              key={item}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                index <= stepIndex ? "bg-primary" : "bg-muted",
              )}
              aria-current={index === stepIndex ? "step" : undefined}
            />
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        {step === "business" && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. The Velvet Comb"
                maxLength={120}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-description">
                Description (optional)
              </Label>
              <Textarea
                id="business-description"
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                placeholder="What does your business do?"
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business-address">Address (optional)</Label>
              <Input
                id="business-address"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="Street address"
                maxLength={160}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="business-city">City</Label>
                <Input
                  id="business-city"
                  value={businessCity}
                  onChange={(e) => setBusinessCity(e.target.value)}
                  placeholder="St. John's"
                  maxLength={80}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business-province">Province</Label>
                <Input
                  id="business-province"
                  value={businessProvince}
                  onChange={(e) => setBusinessProvince(e.target.value)}
                  placeholder="NL"
                  maxLength={40}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="business-postal">Postal code (optional)</Label>
                <Input
                  id="business-postal"
                  value={businessPostalCode}
                  onChange={(e) => setBusinessPostalCode(e.target.value)}
                  placeholder="A1A 1A1"
                  maxLength={20}
                />
              </div>
            </div>
          </div>
        )}

        {step === "services" && (
          <div className="space-y-5">
            <div className="grid gap-2">
              <Label>What does your business do?</Label>
              <p className="text-sm text-muted-foreground -mt-0.5">
                Pick all that apply.
              </p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories.map((category) => {
                  const selected = selectedCategoryIds.has(category.id);
                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className={cn(
                          "group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all",
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-muted/50",
                        )}
                      >
                        {selected && (
                          <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="size-3" />
                          </span>
                        )}
                        <span
                          className={cn(
                            "flex size-10 items-center justify-center rounded-xl transition-colors",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                          )}
                        >
                          <CategoryIcon name={category.icon} className="size-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium leading-tight">
                            {category.name}
                          </span>
                          {category.parentName && (
                            <span className="block text-xs text-muted-foreground">
                              {category.parentName}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {servicesForCategories.length > 0 && (
              <div className="grid gap-2">
                <Label>Services</Label>
                <p className="text-sm text-muted-foreground -mt-0.5">
                  Select the services you offer. You can add more later.
                </p>
                <ul className="space-y-2">
                  {servicesForCategories.map((service) => {
                    const selected = selectedServiceIds.has(service.id);
                    return (
                      <li key={service.id}>
                        <button
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40",
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded border",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30",
                            )}
                          >
                            {selected && <Check className="size-3.5" />}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">
                              {service.name}
                            </span>
                            {service.description && (
                              <span className="block text-xs text-muted-foreground line-clamp-1">
                                {service.description}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === "hours" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Add your weekly hours. You can skip this for now.
            </p>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Day</Label>
                <Select
                  value={hourDay}
                  onValueChange={(v) =>
                    setHourDay((v as (typeof DAYS)[number]) ?? "Mon")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day === "Sun"
                          ? "Sunday"
                          : day === "Mon"
                            ? "Monday"
                            : day === "Tue"
                              ? "Tuesday"
                              : day === "Wed"
                                ? "Wednesday"
                                : day === "Thu"
                                  ? "Thursday"
                                  : day === "Fri"
                                    ? "Friday"
                                    : "Saturday"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hourIsClosed}
                  onChange={(e) => setHourIsClosed(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Closed this day
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="hour-opens">Opens (HH:MM)</Label>
                  <Input
                    id="hour-opens"
                    type="time"
                    value={hourOpensAt}
                    onChange={(e) => setHourOpensAt(e.target.value)}
                    disabled={hourIsClosed}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hour-closes">Closes (HH:MM)</Label>
                  <Input
                    id="hour-closes"
                    type="time"
                    value={hourClosesAt}
                    onChange={(e) => setHourClosesAt(e.target.value)}
                    disabled={hourIsClosed}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addHoursEntry}
                className="w-fit"
              >
                <Plus className="size-4" aria-hidden />
                Add hours
              </Button>
            </div>
            {hours.length > 0 && (
              <ul className="space-y-2">
                {hours.map((entry, index) => (
                  <li
                    key={entry.day}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                  >
                    <p className="text-sm font-medium">
                      {entry.day === "Sun"
                        ? "Sunday"
                        : entry.day === "Mon"
                          ? "Monday"
                          : entry.day === "Tue"
                            ? "Tuesday"
                            : entry.day === "Wed"
                              ? "Wednesday"
                              : entry.day === "Thu"
                                ? "Thursday"
                                : entry.day === "Fri"
                                  ? "Friday"
                                  : "Saturday"}
                      <span className="ml-2 text-muted-foreground">
                        {entry.isClosed
                          ? "Closed"
                          : `${entry.opensAt} – ${entry.closesAt}`}
                      </span>
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHoursEntry(index)}
                      aria-label={`Remove ${entry.day}`}
                    >
                      <Trash2
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === "ai_config" && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Configure the AI assistant that answers customers for you.
            </p>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Tone</Label>
                <Select
                  value={tone}
                  onValueChange={(v) =>
                    setTone(
                      (v as "friendly" | "professional" | "casual") ??
                        "friendly",
                    )
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ai-welcome">Welcome message (optional)</Label>
                <Textarea
                  id="ai-welcome"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="What customers see when a chat starts"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ai-fallback">
                  Fallback message (optional)
                </Label>
                <Textarea
                  id="ai-fallback"
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  placeholder="What the AI says when it can't answer"
                  rows={2}
                  maxLength={500}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={humanEscalation}
                  onChange={(e) => setHumanEscalation(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Let customers request a real person
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={(e) => setVoiceEnabled(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Enable voice conversations
              </label>
              {voiceEnabled && (
                <p className="text-xs text-muted-foreground -mt-2 ml-6">
                  Customers can talk to your AI assistant using their microphone.
                  Voice sessions are not recorded.
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <p
            className="mt-5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={back}
            disabled={stepIndex === 0 || pending}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
          {step === "ai_config" ? (
            <Button type="button" onClick={complete} disabled={pending}>
              {pending ? "Creating…" : "Complete"}
            </Button>
          ) : (
            <Button type="button" onClick={next}>
              Next
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
