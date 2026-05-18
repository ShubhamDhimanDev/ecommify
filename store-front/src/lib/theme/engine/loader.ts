import "server-only";

import { unstable_cache } from "next/cache";
import { detectTenantContext } from "@/lib/theme/engine/tenant";
import { DEFAULT_THEME_CODE, DEFAULT_THEME_CONFIG, ensureThemeConfig } from "@/lib/theme/engine/defaults";
import { isThemeSupportEnabled } from "@/lib/theme/engine/support";
import type { StoreThemePayload, ThemeConfig } from "@/lib/theme/engine/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? "http://localhost:8000";
const THEME_REVALIDATE_SECONDS = 120;

type ThemeLoaderOptions = {
  storeSlug?: string;
  previewTheme?: string | null;
  previewPage?: string | null;
};

type StoreEnvelope = {
  store?: {
    slug?: string;
    name?: string;
    description?: string;
  };
  slug?: string;
  name?: string;
  description?: string;
};

function normalizeThemePayload(raw: unknown): { themeCode: string; config: ThemeConfig } | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const root = (raw as { data?: unknown }).data ?? raw;

  if (!root || typeof root !== "object") {
    return null;
  }

  const record = root as Record<string, unknown>;
  const themeNode = (record.theme as Record<string, unknown> | undefined) ?? undefined;

  const themeCode =
    (typeof record.theme_code === "string" && record.theme_code) ||
    (typeof themeNode?.code === "string" && themeNode.code) ||
    DEFAULT_THEME_CODE;

  const configCandidate = (record.config ?? DEFAULT_THEME_CONFIG) as unknown;

  return {
    themeCode,
    config: ensureThemeConfig(configCandidate),
  };
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Theme request failed: ${response.status}`);
  }

  return response.json();
}

function buildPreviewQuery(previewTheme: string | null, previewPage: string | null): string {
  const query = new URLSearchParams();

  if (previewTheme) {
    query.set("preview_theme", previewTheme);
  }

  if (previewPage) {
    query.set("preview_page", previewPage);
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

async function tryFetchTheme(
  tenantSlug: string,
  host: string | null,
  previewTheme: string | null,
  previewPage: string | null
): Promise<{ payload: { themeCode: string; config: ThemeConfig }; endpoint: string } | null> {
  const previewQuery = buildPreviewQuery(previewTheme, previewPage);

  const endpoints = [
    `${API_BASE}/api/pub/v1/stores/${tenantSlug}/theme${previewQuery}`,
    `${API_BASE}/store/theme${previewQuery}`,
    `${API_BASE}/api/v1/store/${tenantSlug}/theme${previewQuery}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const raw = await fetchJson(endpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(host ? { "X-Tenant-Domain": host } : {}),
          "X-Store-Slug": tenantSlug,
        },
        next: {
          revalidate: THEME_REVALIDATE_SECONDS,
          tags: [`store-theme:${tenantSlug}`],
        },
      });

      const parsed = normalizeThemePayload(raw);

      if (parsed) {
        return {
          payload: parsed,
          endpoint,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function fetchStoreMeta(tenantSlug: string): Promise<{ name?: string; description?: string } | null> {
  try {
    const raw = (await fetchJson(`${API_BASE}/api/pub/v1/stores/${tenantSlug}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: {
        revalidate: THEME_REVALIDATE_SECONDS,
        tags: [`store-meta:${tenantSlug}`],
      },
    })) as StoreEnvelope;

    const store = raw.store ?? raw;

    if (!store || typeof store !== "object") {
      return null;
    }

    return {
      name: typeof store.name === "string" ? store.name : undefined,
      description: typeof store.description === "string" ? store.description : undefined,
    };
  } catch {
    return null;
  }
}

async function loadThemeUncached(
  tenantSlug: string,
  host: string | null,
  previewTheme: string | null,
  previewPage: string | null
): Promise<StoreThemePayload> {
  const [themeResult, storeMeta] = await Promise.all([
    tryFetchTheme(tenantSlug, host, previewTheme, previewPage),
    fetchStoreMeta(tenantSlug),
  ]);

  if (themeResult) {
    return {
      theme_code: themeResult.payload.themeCode,
      config: themeResult.payload.config,
      tenant: {
        slug: tenantSlug,
        domain: host ?? undefined,
        name: storeMeta?.name,
        description: storeMeta?.description,
      },
      sourceEndpoint: themeResult.endpoint,
    };
  }

  return {
    theme_code: DEFAULT_THEME_CODE,
    config: DEFAULT_THEME_CONFIG,
    tenant: {
      slug: tenantSlug,
      domain: host ?? undefined,
      name: storeMeta?.name,
      description: storeMeta?.description,
    },
  };
}

const loadThemeCached = unstable_cache(
  async (tenantSlug: string, host: string | null, previewTheme: string | null, previewPage: string | null) =>
    loadThemeUncached(tenantSlug, host, previewTheme, previewPage),
  ["store-theme-engine"],
  { revalidate: THEME_REVALIDATE_SECONDS }
);

export async function loadStoreTheme(options: ThemeLoaderOptions = {}): Promise<StoreThemePayload> {
  if (!isThemeSupportEnabled()) {
    const tenantContext = await detectTenantContext(options.storeSlug);

    return {
      theme_code: DEFAULT_THEME_CODE,
      config: DEFAULT_THEME_CONFIG,
      tenant: {
        slug: tenantContext.storeSlug || "store",
        domain: tenantContext.host ?? undefined,
      },
      sourceEndpoint: "theme-support-disabled",
    };
  }

  const tenantContext = await detectTenantContext(options.storeSlug);
  const previewTheme = options.previewTheme?.trim() || null;
  const previewPage = options.previewPage?.trim() || null;

  if (!tenantContext.storeSlug) {
    return {
      theme_code: DEFAULT_THEME_CODE,
      config: DEFAULT_THEME_CONFIG,
      tenant: {
        slug: "store",
      },
    };
  }

  return loadThemeCached(tenantContext.storeSlug, tenantContext.host, previewTheme, previewPage);
}
