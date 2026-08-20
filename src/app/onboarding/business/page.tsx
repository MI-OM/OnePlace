import { redirect } from "next/navigation";

import { getUser } from "@/lib/auth";
import { getCatalogCategories, getCatalogServices } from "@/lib/business";
import OnboardingWizard from "@/components/business/onboarding-wizard";

export const metadata = {
  title: "Set up your business — OnePlace",
};

export default async function OnboardingBusinessPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/onboarding/business");

  const [categories, services] = await Promise.all([
    getCatalogCategories(),
    getCatalogServices(),
  ]);

  return (
    <div className="min-h-screen bg-background p-6">
      <OnboardingWizard categories={categories} services={services} />
    </div>
  );
}