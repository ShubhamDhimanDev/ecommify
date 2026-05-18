import type { Category, Product } from "@/lib/types/product";
import type { Store } from "@/lib/types/store";
import type { StoreThemePayload } from "@/lib/theme/engine/types";
import { DEFAULT_THEME_CODE, DEFAULT_THEME_CONFIG } from "@/lib/theme/engine/defaults";
import { isThemeSupportEnabled } from "@/lib/theme/engine/support";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

function buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function makeRequest<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: unknown,
  options?: ApiRequestOptions
): Promise<T> {
  const url = `${API_BASE}${path}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      method,
      headers: buildHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error [${response.status}]: ${errorText}`);
      throw new Error(`API request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
}

export async function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return makeRequest<T>(path, "GET", undefined, options);
}

export async function apiPost<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
  return makeRequest<T>(path, "POST", data, options);
}

export async function apiPut<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
  return makeRequest<T>(path, "PUT", data, options);
}

export async function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return makeRequest<T>(path, "DELETE", undefined, options);
}

type StoreEnvelope = { store: Store };
type CategoryEnvelope = { categories: Category[] };
type ProductEnvelope = { product: Product };
type ProductListEnvelope = { data: Product[] };
type ThemeEnvelope = { data: StoreThemePayload };

function normalizeCategoryList(payload: unknown): Category[] {
  if (Array.isArray(payload)) {
    return payload as Category[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  if ("categories" in payload) {
    const categories = (payload as { categories?: unknown }).categories;

    if (Array.isArray(categories)) {
      return categories as Category[];
    }

    if (categories && typeof categories === "object" && "data" in categories) {
      const wrappedData = (categories as { data?: unknown }).data;
      return Array.isArray(wrappedData) ? (wrappedData as Category[]) : [];
    }
  }

  if ("data" in payload) {
    const data = (payload as { data?: unknown }).data;
    return Array.isArray(data) ? (data as Category[]) : [];
  }

  return [];
}

function normalizeStore(payload: Store | StoreEnvelope): Store {
  if (payload && typeof payload === "object" && "store" in payload) {
    return (payload as StoreEnvelope).store;
  }

  return payload as Store;
}

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    category_name:
      product.category_name ??
      (typeof (product as { category?: { name?: string } }).category?.name === "string"
        ? (product as { category?: { name?: string } }).category?.name
        : undefined),
  };
}

function buildQueryString(filters?: Record<string, unknown>): string {
  if (!filters) {
    return "";
  }

  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

// Customer API (public for auth, authenticated for profile)
export const customerApi = {
  login: (storeSlug: string, email: string, password: string) =>
    apiPost("/api/pub/v1/customers/auth/login", { store_slug: storeSlug, email, password }),
  register: (storeSlug: string, data: { email: string; password: string; first_name: string; last_name?: string }) =>
    apiPost("/api/pub/v1/customers/auth/register", { store_slug: storeSlug, ...data }),
  getProfile: () => apiGet("/api/v1/auth/me"),
  updateProfile: (data: unknown) => apiPut("/api/v1/auth/me", data),
};

// Store API (public)
export const storeApi = {
  getBySlug: async (slug: string): Promise<Store> => {
    const payload = await apiGet<StoreEnvelope | Store>(`/api/pub/v1/stores/${slug}`);
    return normalizeStore(payload);
  },
};

export const themeApi = {
  getByStoreSlug: async (
    slug: string,
    preview?: { theme?: string | null; page?: string | null }
  ): Promise<StoreThemePayload> => {
    if (!isThemeSupportEnabled()) {
      return {
        theme_code: DEFAULT_THEME_CODE,
        config: DEFAULT_THEME_CONFIG,
        tenant: {
          slug,
        },
        sourceEndpoint: "theme-support-disabled",
      };
    }

    const query = new URLSearchParams();

    if (preview?.theme) {
      query.set("preview_theme", preview.theme);
    }

    if (preview?.page) {
      query.set("preview_page", preview.page);
    }

    const queryString = query.toString();
    const path = `/api/pub/v1/stores/${slug}/theme${queryString ? `?${queryString}` : ""}`;

    const payload = await apiGet<ThemeEnvelope | StoreThemePayload>(path);

    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as ThemeEnvelope).data;
    }

    return payload as StoreThemePayload;
  },
};

// Cart API (authenticated, scoped to store/tenant)
export const cartApi = {
  getCart: (storeSlug: string, cartId: string) => apiGet(`/api/v1/store/${storeSlug}/carts/${cartId}`),
  createCart: (storeSlug: string) =>
    apiPost(`/api/v1/store/${storeSlug}/carts`, {}),
  addItem: (storeSlug: string, cartId: string, data: unknown) =>
    apiPost(`/api/v1/store/${storeSlug}/carts/${cartId}/items`, data),
  removeItem: (storeSlug: string, cartId: string, itemId: string) =>
    apiDelete(`/api/v1/store/${storeSlug}/carts/${cartId}/items/${itemId}`),
  checkout: (storeSlug: string, cartId: string) =>
    apiPost(`/api/v1/store/${storeSlug}/carts/${cartId}/checkout`, {}),
};

// Product API (public)
export const productApi = {
  list: async (slug: string, filters?: Record<string, unknown>): Promise<Product[]> => {
    const queryString = buildQueryString(filters);
    const payload = await apiGet<ProductListEnvelope>(`/api/pub/v1/stores/${slug}/products${queryString}`);
    return (payload.data ?? []).map((product) => normalizeProduct(product));
  },
  getById: async (slug: string, id: string): Promise<Product> => {
    const payload = await apiGet<ProductEnvelope>(`/api/pub/v1/stores/${slug}/products/${id}`);
    return normalizeProduct(payload.product);
  },
};

// Category API (public)
export const categoryApi = {
  list: async (slug: string): Promise<Category[]> => {
    const payload = await apiGet<CategoryEnvelope | Category[] | { data?: Category[] }>(`/api/pub/v1/stores/${slug}/categories`);
    return normalizeCategoryList(payload);
  },
};

// Order API (authenticated, scoped to store/tenant)
export const orderApi = {
  list: (storeSlug: string) => apiGet(`/api/v1/store/${storeSlug}/orders`),
  getById: (storeSlug: string, id: string) => apiGet(`/api/v1/store/${storeSlug}/orders/${id}`),
};
