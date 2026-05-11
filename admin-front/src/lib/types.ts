// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  status: "active" | "suspended" | "invited";
  tenant_id: string | null;
  email_verified_at: string | null;
  two_factor_enabled: boolean;
  roles: string[];
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
}

export interface AuthTokenResponse {
  user: User;
  access_token: string;
  token_type: string;
  expires_at: string | null;
}

// ─── Tenant ────────────────────────────────────────────────────────────────────

export type TenantStatus = "active" | "suspended" | "pending" | "cancelled";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  domains?: Domain[];
}

export interface Domain {
  id: number;
  domain: string;
  tenant_id: string;
  type: "subdomain" | "custom";
  is_primary: boolean;
  verified_at: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  depth: number;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  price: string;
  stock: number;
  description: string | null;
  hs_code: string | null;
  tags?: ProductTag[];
  images?: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
}

export interface ProductTag {
  id: string;
  product_id: string;
  tag_name: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  media_type: "image" | "video";
  storage_path: string | null;
  alt_text: string | null;
  sort_order: number;
  file_size: number | null;
  mime_type: string | null;
  disk: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: string | null;
  stock: number;
}

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// ─── API Errors ────────────────────────────────────────────────────────────────

export interface ApiValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface ApiError {
  message: string;
}
