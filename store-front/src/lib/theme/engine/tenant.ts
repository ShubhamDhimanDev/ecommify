import { headers } from "next/headers";

export type TenantContext = {
  host: string | null;
  storeSlug: string | null;
  source: "route" | "domain" | "none";
};

function normalizeHost(rawHost: string | null): string | null {
  if (!rawHost) {
    return null;
  }

  const value = rawHost.split(",")[0]?.trim() ?? "";
  const [hostname] = value.split(":");

  return hostname?.toLowerCase() || null;
}

function looksLikeIpAddress(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

export function deriveStoreSlugFromHost(host: string | null): string | null {
  if (!host || looksLikeIpAddress(host) || host === "localhost") {
    return null;
  }

  if (host.endsWith(".localhost")) {
    return host.replace(/\.localhost$/, "") || null;
  }

  const labels = host.split(".").filter(Boolean);

  if (labels.length >= 3) {
    return labels[0] ?? null;
  }

  return null;
}

export async function detectTenantContext(explicitStoreSlug?: string): Promise<TenantContext> {
  const requestHeaders = await headers();
  const host = normalizeHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));

  if (explicitStoreSlug) {
    return {
      host,
      storeSlug: explicitStoreSlug,
      source: "route",
    };
  }

  const domainSlug = deriveStoreSlugFromHost(host);

  return {
    host,
    storeSlug: domainSlug,
    source: domainSlug ? "domain" : "none",
  };
}
