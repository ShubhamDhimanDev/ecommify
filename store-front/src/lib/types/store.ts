import type { StorefrontThemeOverrides } from "@/lib/theme/types";

export type Store = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo_url?: string;
  business_name?: string;
  status?: "active" | "inactive";
  theme?: StorefrontThemeOverrides;
  settings?: {
    theme?: StorefrontThemeOverrides;
    [key: string]: unknown;
  };
  [key: string]: unknown;
  created_at?: string;
  updated_at?: string;
};
