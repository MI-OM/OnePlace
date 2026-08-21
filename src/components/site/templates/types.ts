import type { BusinessProfile, BusinessProduct } from "@/lib/business";

export type SiteBusiness = BusinessProfile & {
  websitePrimaryColor: string;
  websiteAccentColor: string;
  products?: BusinessProduct[];
};

export type TemplateProps = {
  business: SiteBusiness;
};
