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
  getBySlug: (slug: string) => apiGet(`/api/pub/v1/stores/${slug}`),
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
  list: (slug: string, filters?: Record<string, unknown>) => {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return apiGet(`/api/pub/v1/stores/${slug}/products?${query.toString()}`);
  },
  getById: (slug: string, id: string) => apiGet(`/api/pub/v1/stores/${slug}/products/${id}`),
};

// Category API (public)
export const categoryApi = {
  list: (slug: string) => apiGet(`/api/pub/v1/stores/${slug}/categories`),
};

// Order API (authenticated, scoped to store/tenant)
export const orderApi = {
  list: (storeSlug: string) => apiGet(`/api/v1/store/${storeSlug}/orders`),
  getById: (storeSlug: string, id: string) => apiGet(`/api/v1/store/${storeSlug}/orders/${id}`),
};
