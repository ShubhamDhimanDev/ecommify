export type ThemeSectionSettings = Record<string, unknown>;

export type ThemeSection = {
  id?: string;
  type: string;
  disabled?: boolean;
  settings?: ThemeSectionSettings;
};

export type ThemePageSeo = {
  title?: string;
  description?: string;
  canonical?: string;
  robots?: string;
};

export type ThemeStructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

export type ThemePageConfig = {
  sections: ThemeSection[];
  seo?: ThemePageSeo;
  structuredData?: ThemeStructuredData;
  structured_data?: ThemeStructuredData;
};

export type ThemeConfig = {
  pages: Record<string, ThemePageConfig>;
};

export type StoreThemePayload = {
  theme_code: string;
  config: ThemeConfig;
  tenant: {
    slug: string;
    domain?: string;
    name?: string;
    description?: string;
  };
  sourceEndpoint?: string;
};

export type SectionRenderContext = {
  storeSlug: string;
  tenantDomain?: string;
  themeCode?: string;
};

export type SectionComponentProps<TSettings extends ThemeSectionSettings = ThemeSectionSettings> = {
  settings: TSettings;
  context: SectionRenderContext;
  index: number;
  section: ThemeSection;
};
