import type { StorefrontTheme, StorefrontThemeOverrides } from "@/lib/theme/types";
import type { CSSProperties } from "react";

export const defaultTheme: StorefrontTheme = {
  palette: {
    background: "#fdf8f8",
    foreground: "#1c1b1b",
    surface: "#ffffff",
    surfaceLow: "#f7f3f2",
    surfaceVariant: "#e5e2e1",
    surfaceContainer: "#f1edec",
    surfaceContainerHigh: "#ebe7e6",
    primary: "#1c1b1b",
    onPrimary: "#ffffff",
    secondary: "#585f6c",
    outline: "#747878",
    outlineVariant: "#c4c7c7",
    accent: "#dce2f3",
  },
  typography: {
    displayFamily: "var(--font-display)",
    bodyFamily: "var(--font-body)",
  },
};

export function resolveTheme(overrides?: StorefrontThemeOverrides | null): StorefrontTheme {
  return {
    palette: {
      ...defaultTheme.palette,
      ...(overrides?.palette ?? {}),
    },
    typography: {
      ...defaultTheme.typography,
      ...(overrides?.typography ?? {}),
    },
  };
}

export function themeToCssVars(theme: StorefrontTheme): CSSProperties {
  return {
    ["--background" as string]: theme.palette.background,
    ["--foreground" as string]: theme.palette.foreground,
    ["--surface" as string]: theme.palette.surface,
    ["--surface-low" as string]: theme.palette.surfaceLow,
    ["--surface-variant" as string]: theme.palette.surfaceVariant,
    ["--surface-container" as string]: theme.palette.surfaceContainer,
    ["--surface-container-high" as string]: theme.palette.surfaceContainerHigh,
    ["--primary" as string]: theme.palette.primary,
    ["--on-primary" as string]: theme.palette.onPrimary,
    ["--secondary" as string]: theme.palette.secondary,
    ["--outline" as string]: theme.palette.outline,
    ["--outline-variant" as string]: theme.palette.outlineVariant,
    ["--accent" as string]: theme.palette.accent,
  };
}