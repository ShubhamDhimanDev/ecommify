import type { SectionComponentProps } from "@/lib/theme/engine/types";

type TrustBadgeItem = {
  title?: string;
  description?: string;
};

type TrustBadgesSettings = {
  items?: TrustBadgeItem[];
};

export function TrustBadgesSection({ settings }: SectionComponentProps<TrustBadgesSettings>) {
  const items = Array.isArray(settings.items) ? settings.items : [];

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="px-4">
      <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
        {items.map((entry, index) => {
          const title = typeof entry?.title === "string" && entry.title.trim().length > 0
            ? entry.title
            : `Value ${index + 1}`;
          const description = typeof entry?.description === "string"
            ? entry.description
            : "";

          return (
            <article key={`${title}-${index}`} className="rounded-2xl border border-outline-variant/35 bg-surface p-5">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              {description ? <p className="mt-1 text-sm text-secondary">{description}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
