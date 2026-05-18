import type { ThemeConfig, ThemePageConfig, ThemeSection } from "@/lib/theme/engine/types";

const DEFAULT_HOME_SECTIONS: ThemeSection[] = [
  {
    type: "announcement-bar",
    settings: {
      text: "Premium wax & fragrance. Pure craftsmanship. Free shipping on orders over $75.",
      linkLabel: "Shop now",
      linkHref: "/products",
    },
  },
  {
    type: "hero",
    settings: {
      eyebrow: "Handcrafted Candles",
      title: "Perfectly Scented. Beautifully Made.",
      subtitle: "Premium waxes, essential oils, and creative packaging for candles that sell. Built for makers who care about quality.",
      primaryCtaLabel: "Browse collection",
      secondaryCtaLabel: "View guides",
      heroImage: "https://images.unsplash.com/photo-1603006905393-cf9cc6f6f47d?w=1200&h=1200&fit=crop",
    },
  },
  {
    type: "featured-categories",
    settings: {
      title: "Shop by Scent Profile",
      subtitle: "Discover your signature candle style.",
      categories: [
        { label: "Warm & Spiced", href: "/products?family=spiced" },
        { label: "Fresh & Citrus", href: "/products?family=citrus" },
        { label: "Floral & Botanical", href: "/products?family=floral" },
        { label: "Seasonal", href: "/products?family=seasonal" },
      ],
    },
  },
  {
    type: "product-grid",
    settings: {
      title: "Best-Selling Collections",
      subtitle: "Customer favorites from our signature line.",
      ctaLabel: "Explore all candles",
      products: [
        {
          title: "Premium Soy Wax - Natural Blend",
          price: "$24",
          image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=1000&h=1000&fit=crop",
          badge: "Popular",
        },
        {
          title: "Amber Glass Jar 8oz",
          price: "$12",
          image: "https://images.unsplash.com/photo-1603006905393-cf9cc6f6f47d?w=1000&h=1000&fit=crop",
          badge: "Best for resale",
        },
        {
          title: "Fragrance Oil Sampler - 12 Scents",
          price: "$38",
          image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=1000&h=1000&fit=crop",
          badge: "Top seller",
        },
      ],
    },
  },
  {
    type: "trust-badges",
    settings: {
      items: [
        { title: "Lab-Tested Quality", description: "All materials meet industry purity standards." },
        { title: "Fast Shipping", description: "Most orders dispatch within 24 hours." },
        { title: "Expert Support", description: "Candle makers helping candle makers." },
      ],
    },
  },
  {
    type: "content-tiles",
    settings: {
      title: "Candle Making Resources",
      tiles: [
        {
          title: "Wax Selection Guide",
          description: "Compare soy, paraffin, blends, and specialty waxes to find your perfect match.",
          href: "/guides/wax-selection",
          ctaLabel: "View guide",
        },
        {
          title: "Fragrance Oil Blending Tips",
          description: "Master scent layering with essential and fragrance oils for signature blends.",
          href: "/guides/fragrance",
          ctaLabel: "Learn more",
        },
        {
          title: "Production Best Practices",
          description: "Optimize pour temps, temperatures, and cooling for consistent quality.",
          href: "/guides/production",
          ctaLabel: "Read article",
        },
      ],
    },
  },
];

const DEFAULT_HOME_PAGE: ThemePageConfig = {
  sections: DEFAULT_HOME_SECTIONS,
  seo: {
    title: "CandleScience - Premium Candle Making Supplies",
    description: "Shop premium wax, fragrance oils, and supplies for candle makers. Lab-tested quality, fast shipping, expert support.",
  },
};

export const DEFAULT_THEME_CODE = "candlescience";

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  pages: {
    home: DEFAULT_HOME_PAGE,
  },
};

function normalizeSections(sections: unknown): ThemeSection[] {
  if (!Array.isArray(sections)) {
    return DEFAULT_HOME_SECTIONS;
  }

  const normalized = sections
    .filter((section): section is ThemeSection => {
      return Boolean(section) && typeof section === "object" && typeof (section as ThemeSection).type === "string";
    })
    .map((section) => ({
      ...section,
      settings: section.settings ?? {},
    }));

  return normalized.length > 0 ? normalized : DEFAULT_HOME_SECTIONS;
}

export function ensureThemeConfig(config: unknown): ThemeConfig {
  const pages =
    config && typeof config === "object" && "pages" in (config as Record<string, unknown>)
      ? ((config as { pages?: Record<string, ThemePageConfig> }).pages ?? {})
      : {};

  const home = pages.home ?? DEFAULT_HOME_PAGE;

  return {
    pages: {
      ...pages,
      home: {
        ...DEFAULT_HOME_PAGE,
        ...home,
        sections: normalizeSections(home.sections),
      },
    },
  };
}
