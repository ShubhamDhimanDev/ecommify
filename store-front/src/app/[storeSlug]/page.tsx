import type { Metadata } from "next";
import { DynamicSectionRenderer } from "@/components/theme/DynamicSectionRenderer";
import { loadStoreTheme } from "@/lib/theme/engine/loader";

type StoreHomePageProps = {
  params: Promise<{ storeSlug: string }>;
  searchParams: Promise<{ preview_theme?: string; preview_page?: string }>;
};

function toStructuredData(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");
  }

  if (value && typeof value === "object") {
    return [value as Record<string, unknown>];
  }

  return [];
}

export async function generateMetadata({ params, searchParams }: StoreHomePageProps): Promise<Metadata> {
  const { storeSlug } = await params;
  const query = await searchParams;
  const themePayload = await loadStoreTheme({
    storeSlug,
    previewTheme: query.preview_theme,
    previewPage: query.preview_page,
  });
  const homePage = themePayload.config.pages.home;

  return {
    title: homePage.seo?.title ?? themePayload.tenant.name ?? "Storefront",
    description: homePage.seo?.description ?? themePayload.tenant.description ?? "Tenant storefront",
    robots: homePage.seo?.robots,
    alternates: homePage.seo?.canonical
      ? {
          canonical: homePage.seo.canonical,
        }
      : undefined,
  };
}

export default async function StoreHomePage({ params, searchParams }: StoreHomePageProps) {
  const { storeSlug } = await params;
  const query = await searchParams;
  const themePayload = await loadStoreTheme({
    storeSlug,
    previewTheme: query.preview_theme,
    previewPage: query.preview_page,
  });
  const homePage = themePayload.config.pages.home;
  const structuredData = toStructuredData(homePage.structuredData ?? homePage.structured_data);

  return (
    <>
      <DynamicSectionRenderer
        sections={homePage.sections}
        className="flex flex-col gap-14"
        context={{
          storeSlug,
          tenantDomain: themePayload.tenant.domain,
          themeCode: themePayload.theme_code,
        }}
      />

      {structuredData.map((entry, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  );
}
