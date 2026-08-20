import type { BusinessProfile } from "@/lib/business";

export type SiteBusiness = BusinessProfile & {
  websitePrimaryColor: string;
  websiteAccentColor: string;
};

export type TemplateProps = {
  business: SiteBusiness;
};
