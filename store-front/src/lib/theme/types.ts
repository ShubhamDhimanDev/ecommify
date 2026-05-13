export type ThemePalette = {
  background: string;
  foreground: string;
  surface: string;
  surfaceLow: string;
  surfaceVariant: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  outline: string;
  outlineVariant: string;
  accent: string;
};

export type ThemeTypography = {
  displayFamily: string;
  bodyFamily: string;
};

export type StorefrontTheme = {
  palette: ThemePalette;
  typography: ThemeTypography;
};

export type StorefrontThemeOverrides = Partial<{
  palette: Partial<ThemePalette>;
  typography: Partial<ThemeTypography>;
}>;