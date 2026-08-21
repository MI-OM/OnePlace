import type { BusinessProfile } from "@/lib/business";

export type SiteBusiness = BusinessProfile & {
  websitePrimaryColor: string;
  websiteAccentColor: string;
  products?: BusinessProduct[];
};

export type TemplateProps = {
  business: SiteBusiness;
};
