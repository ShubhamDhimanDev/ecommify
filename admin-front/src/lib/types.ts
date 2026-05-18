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
  parent_product_id?: string | null;
  is_variant?: boolean;
  parentProduct?: { id: string; name: string; sku: string } | null;
  category?: Pick<Category, "id" | "name" | "slug"> | null;
  price: string;
  discount_type?: 'fixed' | 'percentage' | null;
  discount_value?: string | null;
  stock: number;
  description: string | null;
  hs_code: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  specifications?: Record<string, string> | null;
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
  parent_product_id: string;
  name: string;
  sku: string;
  price: string | null;
  stock: number;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;
  specifications?: Record<string, string> | null;
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

// ─── Payment Gateway ────────────────────────────────────────────────────────────

export type PaymentGateway = "stripe" | "razorpay" | "paypal";

export interface StorePaymentGateway {
  id: number;
  tenant_id: string;
  gateway: PaymentGateway;
  is_active: boolean;
  gateway_account_id: string | null;
  connected_at: string | null;
  last_refreshed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentGatewayConfig {
  gateway: PaymentGateway;
  is_connected: boolean;
  account_id?: string;
  connected_at?: string;
}

// ─── Theme Engine ─────────────────────────────────────────────────────────────

export interface ThemeCatalogItem {
  id: string;
  name: string;
  code: string;
  version: string;
  preview_image: string | null;
  is_public: boolean;
  created_at: string | null;
}

export interface ThemeStoreTheme {
  id: string;
  store_id: string;
  theme_id: string;
  is_active: boolean;
  custom_config: ThemeCustomConfig;
  created_at: string | null;
}

export interface ThemeSettingFieldOption {
  label: string;
  value: string;
}

export interface ThemeSettingField {
  key: string;
  label?: string;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  options?: ThemeSettingFieldOption[];
}

export interface ThemeSection {
  id?: string;
  type: string;
  settings?: Record<string, unknown>;
  settings_schema?: ThemeSettingField[];
  [key: string]: unknown;
}

export interface ThemePageConfig {
  sections?: ThemeSection[];
  [key: string]: unknown;
}

export interface ThemeConfig {
  pages?: Record<string, ThemePageConfig>;
  [key: string]: unknown;
}

export type ThemeCustomConfig = Record<string, unknown>;

export interface ActiveThemePayload {
  store_theme: ThemeStoreTheme;
  theme: ThemeCatalogItem;
  custom_config: ThemeCustomConfig;
  config: ThemeConfig;
}

// ─── API Errors ────────────────────────────────────────────────────────────────

export interface ApiValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface ApiError {
  message: string;
}
