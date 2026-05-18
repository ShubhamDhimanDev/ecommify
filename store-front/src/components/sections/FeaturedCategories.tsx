import Link from "next/link";
import type { SectionComponentProps } from "@/lib/theme/engine/types";

type CategoryLink = {
  label?: string;
  href?: string;
};

type FeaturedCategoriesSettings = {
  title?: string;
  subtitle?: string;
  categories?: CategoryLink[];
};

function resolveHref(storeSlug: string, href: string): string {
  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  return `/${storeSlug}${href.startsWith("/") ? href : `/${href}`}`;
}

export function FeaturedCategoriesSection({ settings, context }: SectionComponentProps<FeaturedCategoriesSettings>) {
  const title = typeof settings.title === "string" ? settings.title : "Shop by category";
  const subtitle = typeof settings.subtitle === "string" ? settings.subtitle : "Explore curated collections.";
  const categories = Array.isArray(settings.categories) ? settings.categories : [];

  return (
    <section className="px-4">
      <div className="mx-auto max-w-7xl rounded-3xl border border-outline-variant/30 bg-surface p-6 md:p-8">
        <div className="mb-5">
          <h2 className="headline-md text-foreground">{title}</h2>
          <p className="mt-1 text-secondary">{subtitle}</p>
        </div>

        {categories.length === 0 ? (
          <p className="text-sm text-secondary">No featured categories configured yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((entry, index) => {
              const label = typeof entry?.label === "string" && entry.label.trim().length > 0
                ? entry.label
                : `Category ${index + 1}`;
              const href = typeof entry?.href === "string" && entry.href.trim().length > 0
                ? entry.href
                : "/products";

              return (
                <Link
                  key={`${label}-${index}`}
                  href={resolveHref(context.storeSlug, href)}
                  className="group rounded-2xl border border-outline-variant/40 bg-surface-container p-4 transition hover:border-outline hover:shadow-sm"
                >
                  <p className="font-semibold text-foreground transition group-hover:text-primary">{label}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
