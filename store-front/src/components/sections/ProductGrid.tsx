import Link from "next/link";
import type { SectionComponentProps } from "@/lib/theme/engine/types";

type ProductGridItem = {
  id?: string;
  title?: string;
  price?: string;
  image?: string;
  href?: string;
  badge?: string;
};

type ProductGridSettings = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  products?: ProductGridItem[];
};

const DEFAULT_SETTINGS: Required<Pick<ProductGridSettings, "title" | "subtitle" | "ctaLabel">> = {
  title: "Featured products",
  subtitle: "Hand-picked products configured directly by your active theme.",
  ctaLabel: "View all",
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=900&h=900&fit=crop";

export function ProductGridSection({ settings, context }: SectionComponentProps<ProductGridSettings>) {
  const resolvedSettings = {
    ...DEFAULT_SETTINGS,
    ...settings,
  };

  const products = Array.isArray(settings.products) ? settings.products : [];

  return (
    <section className="px-4">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-3">
          <div>
            <h2 className="headline-md text-foreground">{resolvedSettings.title}</h2>
            <p className="mt-2 text-secondary">{resolvedSettings.subtitle}</p>
          </div>
          <Link href={resolvedSettings.ctaHref ?? `/${context.storeSlug}/products`} className="btn-secondary whitespace-nowrap">
            {resolvedSettings.ctaLabel}
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="air-card rounded-3xl p-8 text-center text-secondary">
            No products configured for this section yet.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <article key={product.id ?? `${product.title ?? "product"}-${index}`} className="air-card overflow-hidden rounded-3xl">
                <img
                  src={product.image || FALLBACK_IMAGE}
                  alt={product.title || "Product image"}
                  className="h-64 w-full object-cover"
                />
                <div className="space-y-2 p-5">
                  {product.badge ? (
                    <p className="label-caps text-secondary">{product.badge}</p>
                  ) : null}
                  <h3 className="text-lg font-semibold text-foreground">{product.title ?? "Product"}</h3>
                  <p className="text-sm text-secondary">{product.price ?? "Price on request"}</p>
                  <Link href={product.href ?? `/${context.storeSlug}/products`} className="btn-secondary mt-2 inline-flex">
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
