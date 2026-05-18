import Link from "next/link";
import type { SectionComponentProps } from "@/lib/theme/engine/types";

type Tile = {
  title?: string;
  description?: string;
  href?: string;
  ctaLabel?: string;
};

type ContentTileRowSettings = {
  title?: string;
  tiles?: Tile[];
};

function resolveHref(storeSlug: string, href: string): string {
  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  return `/${storeSlug}${href.startsWith("/") ? href : `/${href}`}`;
}

export function ContentTileRowSection({ settings, context }: SectionComponentProps<ContentTileRowSettings>) {
  const title = typeof settings.title === "string" && settings.title.trim().length > 0
    ? settings.title
    : "Learn and explore";
  const tiles = Array.isArray(settings.tiles) ? settings.tiles : [];

  return (
    <section className="px-4 pb-2">
      <div className="mx-auto max-w-7xl">
        <h2 className="headline-md mb-5 text-foreground">{title}</h2>

        {tiles.length === 0 ? (
          <p className="text-sm text-secondary">No content tiles configured yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {tiles.map((tile, index) => {
              const tileTitle = typeof tile?.title === "string" && tile.title.trim().length > 0
                ? tile.title
                : `Tile ${index + 1}`;
              const description = typeof tile?.description === "string" ? tile.description : "";
              const href = typeof tile?.href === "string" && tile.href.trim().length > 0 ? tile.href : "/products";
              const ctaLabel = typeof tile?.ctaLabel === "string" && tile.ctaLabel.trim().length > 0
                ? tile.ctaLabel
                : "Explore";

              return (
                <article key={`${tileTitle}-${index}`} className="rounded-2xl border border-outline-variant/30 bg-surface p-5">
                  <h3 className="text-lg font-semibold text-foreground">{tileTitle}</h3>
                  {description ? <p className="mt-2 text-sm text-secondary">{description}</p> : null}
                  <Link
                    href={resolveHref(context.storeSlug, href)}
                    className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-foreground transition"
                  >
                    {ctaLabel}
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
