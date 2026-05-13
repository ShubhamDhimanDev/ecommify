export type Store = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  logo_url?: string;
  business_name?: string;
  status?: "active" | "inactive";
  created_at?: string;
  updated_at?: string;
};
