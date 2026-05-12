const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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

export async function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: "GET",
    headers: buildHeaders(options?.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: "POST",
    headers: buildHeaders(options?.headers),
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiPut<T>(path: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: "PUT",
    headers: buildHeaders(options?.headers),
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: "DELETE",
    headers: buildHeaders(options?.headers),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

// Customer API
export const customerApi = {
  login: (email: string, password: string) =>
    apiPost("/v1/customers/auth/login", { email, password }),
  register: (data: { email: string; password: string; first_name: string; last_name?: string }) =>
    apiPost("/v1/customers/auth/register", data),
  getProfile: () => apiGet("/v1/customers/me"),
  updateProfile: (data: unknown) => apiPut("/v1/customers/me", data),
};

// Store API (public)
export const storeApi = {
  getBySlug: (slug: string) => apiGet(`/pub/v1/stores/${slug}`),
};

// Cart API
export const cartApi = {
  getCart: (cartId: string) => apiGet(`/v1/carts/${cartId}`),
  createCart: (merchantId: string) =>
    apiPost("/v1/carts", { merchant_id: merchantId }),
  addItem: (cartId: string, data: unknown) =>
    apiPost(`/v1/carts/${cartId}/items`, data),
  removeItem: (cartId: string, itemId: string) =>
    apiDelete(`/v1/carts/${cartId}/items/${itemId}`),
  checkout: (cartId: string) =>
    apiPost(`/v1/carts/${cartId}/checkout`, {}),
};

// Product API
export const productApi = {
  list: (filters?: Record<string, unknown>) => {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return apiGet(`/pub/v1/products?${query.toString()}`);
  },
  getById: (id: string) => apiGet(`/pub/v1/products/${id}`),
};

// Order API
export const orderApi = {
  list: () => apiGet("/v1/orders"),
  getById: (id: string) => apiGet(`/v1/orders/${id}`),
};
