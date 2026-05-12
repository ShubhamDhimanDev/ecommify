import type {
  ApiValidationError,
  AuthTokenResponse,
  Tenant,
  User,
} from "@/lib/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ─── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "ecommify_token";
const ACTIVE_STORE_KEY = "ecommify_active_store_id";

export const tokenStorage = {
  get: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

export const activeStoreStorage = {
  get: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem(ACTIVE_STORE_KEY) : null,
  set: (storeId: string): void => localStorage.setItem(ACTIVE_STORE_KEY, storeId),
  clear: (): void => localStorage.removeItem(ACTIVE_STORE_KEY),
};

// ─── Core fetch helper ─────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.get();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const activeStoreId = activeStoreStorage.get();
  if (activeStoreId) headers["X-Merchant-ID"] = activeStoreId;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: ApiValidationError | { message: string } = {
      message: res.statusText,
    };
    try {
      body = await res.json();
    } catch {}

    const validationBody = body as ApiValidationError;
    throw new ApiError(
      res.status,
      validationBody.message ?? res.statusText,
      validationBody.errors
    );
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
};

// ─── Auth endpoints ────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post<AuthTokenResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokenResponse | { two_factor_required: true; two_factor_token: string; message: string }>(
      "/auth/login",
      data
    ),

  logout: () => api.post<{ message: string }>("/auth/logout"),

  me: () => api.get<User>("/auth/me"),

  updateMe: (data: Partial<{ name: string; phone: string; avatar: string }>) =>
    api.put<User>("/auth/me", data),

  changePassword: (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.post<{ message: string }>("/auth/change-password", data),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/auth/forgot-password", { email }),

  resetPassword: (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => api.post<{ message: string }>("/auth/reset-password", data),

  resendVerification: () =>
    api.post<{ message: string }>("/auth/email/resend"),

  verifyEmail: (id: string, hash: string, expires: string, signature: string) =>
    api.get<{ message: string }>(
      `/auth/email/verify/${id}/${hash}?expires=${expires}&signature=${encodeURIComponent(signature)}`
    ),
};

// ─── 2FA endpoints ─────────────────────────────────────────────────────────────

export const twoFactorApi = {
  enable: () =>
    api.post<{
      qr_code: string;
      secret: string;
      recovery_codes: string[];
    }>("/auth/2fa/enable"),

  confirm: (code: string) =>
    api.post<{ message: string }>("/auth/2fa/confirm", { code }),

  disable: (password: string) =>
    api.delete<{ message: string }>("/auth/2fa/disable", { password }),

  challenge: (code: string, twoFactorToken: string) =>
    api.post<AuthTokenResponse>("/auth/2fa/challenge", { code, two_factor_token: twoFactorToken }),

  recoveryCodes: () =>
    api.get<{ recovery_codes: string[] }>("/auth/2fa/recovery-codes"),

  regenerateRecoveryCodes: () =>
    api.post<{ recovery_codes: string[] }>("/auth/2fa/recovery-codes"),
};

// ─── Merchant / Store endpoints ────────────────────────────────────────────────

export const storeApi = {
  get: () => api.get<{ store: Tenant | null }>("/merchant/store"),

  list: async (): Promise<{ stores: Tenant[] }> => {
    const normalize = (payload: unknown): Tenant[] => {
      if (Array.isArray(payload)) return payload as Tenant[];
      if (payload && typeof payload === "object") {
        const o = payload as Record<string, unknown>;
        if (Array.isArray(o.stores)) return o.stores as Tenant[];
        if (Array.isArray(o.data)) return o.data as Tenant[];
        if (o.store && typeof o.store === "object") return [o.store as Tenant];
      }
      return [];
    };

    const candidates = ["/merchant/stores", "/merchants/mine"];

    for (const path of candidates) {
      try {
        const raw = await api.get<unknown>(path);
        return { stores: normalize(raw) };
      } catch (error: unknown) {
        const apiError = error as ApiError;
        if (apiError.status && ![404, 405].includes(apiError.status)) {
          throw error;
        }
      }
    }

    const single = await storeApi.get();
    return { stores: single.store ? [single.store] : [] };
  },

  create: (data: { name: string; slug: string; plan?: string }) =>
    api.post<{ store: Tenant; user: User }>("/merchant/store", data),

  update: (data: Partial<{ name: string; slug: string; plan: string }>) =>
    api.put<{ store: Tenant }>("/merchant/store", data),
};

export const categoryApi = {
  list: (tenantSlug: string, q?: string) => {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    return api.get<{ categories: Array<{ id: string; name: string; slug: string; parent_id: string | null; depth: number; created_at: string; }> }>(
      `/store/${encodeURIComponent(tenantSlug)}/categories${query}`
    );
  },

  create: (tenantSlug: string, data: { name: string; slug: string; parent_id?: string | null }) =>
    api.post<{ category: { id: string; name: string; slug: string; parent_id: string | null; depth: number; created_at: string; } }>(
      `/store/${encodeURIComponent(tenantSlug)}/categories`,
      data
    ),

  update: (tenantSlug: string, id: string, data: { name?: string; slug?: string; parent_id?: string | null }) =>
    api.put<{ category: { id: string; name: string; slug: string; parent_id: string | null; depth: number; created_at: string; } }>(
      `/store/${encodeURIComponent(tenantSlug)}/categories/${id}`,
      data
    ),

  remove: (tenantSlug: string, id: string) =>
    api.delete<void>(`/store/${encodeURIComponent(tenantSlug)}/categories/${id}`),
};

export const productApi = {
  list: (tenantSlug: string, params?: { q?: string; category_id?: string }) => {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.category_id) search.set("category_id", params.category_id);
    const query = search.toString() ? `?${search.toString()}` : "";

    return api.get<{
      data: Array<{
        id: string;
        name: string;
        sku: string;
        category_id: string | null;
        parent_product_id: string | null;
        is_variant: boolean;
        parentProduct?: { id: string; name: string; sku: string } | null;
        category?: { id: string; name: string; slug: string } | null;
        price: string;
        discount_type: 'fixed' | 'percentage' | null;
        discount_value: string | null;
        stock: number;
        description: string | null;
        hs_code: string | null;
        meta_title: string | null;
        meta_description: string | null;
        meta_keywords: string[] | null;
        specifications: Record<string, string> | null;
        tags?: Array<{ id: string; product_id: string; tag_name: string }>;
        images?: Array<{
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
        }>;
        variants?: Array<{
          id: string;
          parent_product_id: string;
          name: string;
          sku: string;
          price: string | null;
          stock: number;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          meta_keywords: string[] | null;
          specifications: Record<string, string> | null;
        }>;
        created_at: string;
      }>;
      current_page: number;
      last_page: number;
      total: number;
    }>(`/store/${encodeURIComponent(tenantSlug)}/products${query}`);
  },

  detail: (tenantSlug: string, id: string) =>
    api.get<{
      product: {
        id: string;
        name: string;
        sku: string;
        category_id: string | null;
        parent_product_id: string | null;
        is_variant: boolean;
        parentProduct?: { id: string; name: string; sku: string } | null;
        category?: { id: string; name: string; slug: string } | null;
        price: string;
        discount_type: 'fixed' | 'percentage' | null;
        discount_value: string | null;
        stock: number;
        description: string | null;
        hs_code: string | null;
        meta_title: string | null;
        meta_description: string | null;
        meta_keywords: string[] | null;
        specifications: Record<string, string> | null;
        tags: Array<{ id: string; product_id: string; tag_name: string }>;
        images: Array<{
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
        }>;
        variants: Array<{
          id: string;
          parent_product_id: string;
          name: string;
          sku: string;
          price: string | null;
          stock: number;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          meta_keywords: string[] | null;
          specifications: Record<string, string> | null;
        }>;
        created_at: string;
      };
    }>(`/store/${encodeURIComponent(tenantSlug)}/products/${id}`),

  create: (
    tenantSlug: string,
    data:
      | FormData
      | {
      name: string;
      sku: string;
      category_id?: string | null;
      price: number;
      stock?: number;
      description?: string | null;
      hs_code?: string | null;
      meta_title?: string | null;
      meta_description?: string | null;
      meta_keywords?: string[] | null;
      specifications?: Record<string, string> | null;
      tags?: string[];
      images?: Array<{
        image_url: string;
        alt_text?: string | null;
        sort_order?: number;
        file_size?: number | null;
        mime_type?: string | null;
        disk?: string | null;
      }>;
      }
  ) =>
    api.post<{
      product: {
        id: string;
        name: string;
        sku: string;
        category_id: string | null;
        parent_product_id: string | null;
        is_variant: boolean;
        category?: { id: string; name: string; slug: string } | null;
        price: string;
        stock: number;
        description: string | null;
        hs_code: string | null;
        meta_title: string | null;
        meta_description: string | null;
        meta_keywords: string[] | null;
        specifications: Record<string, string> | null;
        tags: Array<{ id: string; product_id: string; tag_name: string }>;
        images: Array<{
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
        }>;
        variants: Array<{
          id: string;
          parent_product_id: string;
          name: string;
          sku: string;
          price: string | null;
          stock: number;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          meta_keywords: string[] | null;
          specifications: Record<string, string> | null;
        }>;
        created_at: string;
      };
    }>(`/store/${encodeURIComponent(tenantSlug)}/products`, data),

  update: (
    tenantSlug: string,
    id: string,
    data:
      | FormData
      | {
      name?: string;
      sku?: string;
      category_id?: string | null;
      price?: number;
      stock?: number;
      description?: string | null;
      hs_code?: string | null;
      meta_title?: string | null;
      meta_description?: string | null;
      meta_keywords?: string[] | null;
      specifications?: Record<string, string> | null;
      tags?: string[];
      images?: Array<{
        image_url: string;
        alt_text?: string | null;
        sort_order?: number;
        file_size?: number | null;
        mime_type?: string | null;
        disk?: string | null;
      }>;
      }
  ) =>
    api.put<{
      product: {
        id: string;
        name: string;
        sku: string;
        category_id: string | null;
        parent_product_id: string | null;
        is_variant: boolean;
        category?: { id: string; name: string; slug: string } | null;
        price: string;
        stock: number;
        description: string | null;
        hs_code: string | null;
        meta_title: string | null;
        meta_description: string | null;
        meta_keywords: string[] | null;
        specifications: Record<string, string> | null;
        tags: Array<{ id: string; product_id: string; tag_name: string }>;
        images: Array<{
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
        }>;
        variants: Array<{
          id: string;
          parent_product_id: string;
          name: string;
          sku: string;
          price: string | null;
          stock: number;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          meta_keywords: string[] | null;
          specifications: Record<string, string> | null;
        }>;
        created_at: string;
      };
    }>(`/store/${encodeURIComponent(tenantSlug)}/products/${id}`, data),

  createVariant: (
    tenantSlug: string,
    id: string,
    data: FormData | {
      sku: string;
      name?: string;
      category_id?: string | null;
      price?: number | null;
      stock?: number | null;
      description?: string | null;
      hs_code?: string | null;
      meta_title?: string | null;
      meta_description?: string | null;
      meta_keywords?: string[] | null;
      specifications?: Record<string, string> | null;
      copy_images?: boolean;
      copy_tags?: boolean;
      tags?: string[];
    }
  ) =>
    api.post<{
      product: {
        id: string;
        name: string;
        sku: string;
        category_id: string | null;
        parent_product_id: string | null;
        is_variant: boolean;
        category?: { id: string; name: string; slug: string } | null;
        price: string;
        stock: number;
        description: string | null;
        hs_code: string | null;
        meta_title: string | null;
        meta_description: string | null;
        meta_keywords: string[] | null;
        specifications: Record<string, string> | null;
        tags: Array<{ id: string; product_id: string; tag_name: string }>;
        images: Array<{
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
        }>;
        variants: Array<{
          id: string;
          parent_product_id: string;
          name: string;
          sku: string;
          price: string | null;
          stock: number;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
          meta_keywords: string[] | null;
          specifications: Record<string, string> | null;
        }>;
        created_at: string;
      };
    }>(`/store/${encodeURIComponent(tenantSlug)}/products/${id}/variants`, data),

  remove: (tenantSlug: string, id: string) =>
    api.delete<void>(`/store/${encodeURIComponent(tenantSlug)}/products/${id}`),
};

export const customerApi = {
  list: (tenantSlug: string, q?: string) => {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    return api.get<{
      data: Array<{
        id: string;
        first_name: string;
        last_name: string | null;
        email: string | null;
        phone: string | null;
        notes: string | null;
        created_at: string;
      }>;
      current_page: number;
      last_page: number;
      total: number;
    }>(`/store/${encodeURIComponent(tenantSlug)}/customers${query}`);
  },

  create: (
    tenantSlug: string,
    data: {
      first_name: string;
      last_name?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
      password?: string | null;
    }
  ) => api.post<{ customer: unknown }>(`/store/${encodeURIComponent(tenantSlug)}/customers`, data),

  update: (
    tenantSlug: string,
    id: string,
    data: {
      first_name?: string;
      last_name?: string | null;
      email?: string | null;
      phone?: string | null;
      notes?: string | null;
      password?: string | null;
    }
  ) => api.put<{ customer: unknown }>(`/store/${encodeURIComponent(tenantSlug)}/customers/${id}`, data),

  remove: (tenantSlug: string, id: string) =>
    api.delete<void>(`/store/${encodeURIComponent(tenantSlug)}/customers/${id}`),
};

export const orderApi = {
  list: (tenantSlug: string, params?: { status?: string; customer_id?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.customer_id) search.set("customer_id", params.customer_id);
    const query = search.toString() ? `?${search.toString()}` : "";

    return api.get<{
      data: Array<{
        id: string;
        customer_id: string | null;
        status: string;
        currency: string;
        subtotal: string;
        tax_amount: string;
        total_amount: string;
        created_at: string;
      }>;
      current_page: number;
      last_page: number;
      total: number;
    }>(`/store/${encodeURIComponent(tenantSlug)}/orders${query}`);
  },

  detail: (tenantSlug: string, id: string) =>
    api.get<{
      order: {
        id: string;
        status: string;
        currency: string;
        subtotal: string;
        tax_amount: string;
        total_amount: string;
        created_at: string;
      };
      items: Array<{
        id: string;
        product_name: string;
        product_sku: string | null;
        quantity: number;
        unit_price: string;
        line_total: string;
      }>;
      events: Array<{
        id: string;
        from_status: string | null;
        to_status: string;
        note: string | null;
        created_at: string;
      }>;
    }>(`/store/${encodeURIComponent(tenantSlug)}/orders/${id}`),

  updateStatus: (tenantSlug: string, id: string, data: { status: string; note?: string }) =>
    api.patch<{ order: unknown }>(`/store/${encodeURIComponent(tenantSlug)}/orders/${id}/status`, data),
};
