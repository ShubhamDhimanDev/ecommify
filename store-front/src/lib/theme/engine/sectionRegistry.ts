import { HeroSection } from "@/components/sections/Hero";
import { ProductGridSection } from "@/components/sections/ProductGrid";
import { AnnouncementBarSection } from "@/components/sections/AnnouncementBar";
import { FeaturedCategoriesSection } from "@/components/sections/FeaturedCategories";
import { TrustBadgesSection } from "@/components/sections/TrustBadges";
import { ContentTileRowSection } from "@/components/sections/ContentTileRow";
import type { SectionComponentProps } from "@/lib/theme/engine/types";
import type { ReactNode } from "react";

type SectionComponent = (props: SectionComponentProps) => ReactNode;

export const SECTION_MAP: Record<string, SectionComponent> = {
  "announcement-bar": AnnouncementBarSection,
  hero: HeroSection,
  "featured-categories": FeaturedCategoriesSection,
  "product-grid": ProductGridSection,
  "featured-collection": ProductGridSection,
  "trust-badges": TrustBadgesSection,
  "content-tiles": ContentTileRowSection,
};

export function resolveSectionComponent(type: string): SectionComponent | null {
  return SECTION_MAP[type] ?? null;
}
