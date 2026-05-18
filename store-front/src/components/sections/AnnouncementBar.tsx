import Link from "next/link";
import type { SectionComponentProps } from "@/lib/theme/engine/types";

type AnnouncementBarSettings = {
  text?: string;
  linkLabel?: string;
  linkHref?: string;
};

export function AnnouncementBarSection({ settings, context }: SectionComponentProps<AnnouncementBarSettings>) {
  const text = typeof settings.text === "string" && settings.text.trim().length > 0
    ? settings.text
    : "Welcome to our latest drop.";
  const linkLabel = typeof settings.linkLabel === "string" ? settings.linkLabel : "Learn more";
  const linkHref = typeof settings.linkHref === "string" && settings.linkHref.trim().length > 0
    ? settings.linkHref
    : "/products";

  const href = /^https?:\/\//i.test(linkHref)
    ? linkHref
    : `/${context.storeSlug}${linkHref.startsWith("/") ? linkHref : `/${linkHref}`}`;

  return (
    <section className="border-y border-outline-variant/40 bg-surface-container px-4 py-2">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 text-center text-sm text-secondary">
        <span>{text}</span>
        <Link href={href} className="font-semibold text-foreground hover:text-primary transition">
          {linkLabel}
        </Link>
      </div>
    </section>
  );
}
