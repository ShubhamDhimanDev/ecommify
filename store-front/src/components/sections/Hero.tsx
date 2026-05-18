import Link from "next/link";
import Image from "next/image";
import { MoveRight, ShieldCheck, Truck, Undo2 } from "lucide-react";
import type { SectionComponentProps } from "@/lib/theme/engine/types";

type HeroSettings = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  heroImage?: string;
  backgroundImage?: string;
};

const DEFAULT_HERO_SETTINGS: Required<Pick<HeroSettings, "eyebrow" | "title" | "subtitle" | "primaryCtaLabel" | "secondaryCtaLabel">> = {
  eyebrow: "Shop with confidence",
  title: "Find your next favorite thing",
  subtitle: "A fast storefront powered by tenant-aware, section-based themes.",
  primaryCtaLabel: "Start exploring",
  secondaryCtaLabel: "Discover trends",
};

export function HeroSection({ settings, context }: SectionComponentProps<HeroSettings>) {
  const resolvedSettings = {
    ...DEFAULT_HERO_SETTINGS,
    ...settings,
  };

  const backgroundStyle = {
    background: resolvedSettings.backgroundImage
      ? `linear-gradient(120deg, rgba(255,255,255,0.72), rgba(255,255,255,0.88)), url(${resolvedSettings.backgroundImage})`
      : "linear-gradient(120deg, #fff7f9 0%, #ffffff 55%, #fff2f5 100%)",
    backgroundSize: resolvedSettings.backgroundImage ? "cover" : "auto",
    backgroundPosition: "center",
  };

  return (
    <section className="relative overflow-hidden border-b border-outline-variant/40" style={backgroundStyle}>
      <div className="relative px-4 py-16 sm:py-20 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="anim-fade-in max-w-2xl">
              <p className="label-caps mb-4 text-secondary">{resolvedSettings.eyebrow}</p>
              <h1 className="display-lg-mobile md:display-lg mb-6 text-foreground">
                {resolvedSettings.title}
              </h1>
              <p className="body-lg mb-8 max-w-xl text-secondary">
                {resolvedSettings.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={resolvedSettings.primaryCtaHref ?? `/${context.storeSlug}/products`}
                  className="btn-primary"
                >
                  {resolvedSettings.primaryCtaLabel} <MoveRight className="h-5 w-5" />
                </Link>
                <Link href={resolvedSettings.secondaryCtaHref ?? `/${context.storeSlug}`} className="btn-secondary">
                  {resolvedSettings.secondaryCtaLabel}
                </Link>
              </div>
            </div>

            <div className="air-card hidden overflow-hidden rounded-[30px] md:block">
              <Image
                src={resolvedSettings.heroImage || "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&h=900&fit=crop"}
                alt={resolvedSettings.title}
                width={900}
                height={900}
                className="h-[420px] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 pb-10">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Truck, title: "Fast Shipping", desc: "Reliable delivery with real-time tracking" },
              { icon: ShieldCheck, title: "Secure Checkout", desc: "Protected payments and encrypted transactions" },
              { icon: Undo2, title: "Easy Returns", desc: "Hassle-free returns within 30 days" },
            ].map((feature, i) => (
              <div key={i} className="air-card flex items-start gap-4 rounded-2xl p-5">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-secondary">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
