import type { StorefrontTheme, StorefrontThemeOverrides } from "@/lib/theme/types";
import type { CSSProperties } from "react";

export const defaultTheme: StorefrontTheme = {
  palette: {
    background: "#faf8f5",
    foreground: "#3c3c3c",
    surface: "#ffffff",
    surfaceLow: "#faf8f5",
    surfaceVariant: "#f0ebe5",
    surfaceContainer: "#ede7df",
    surfaceContainerHigh: "#e8e1d9",
    primary: "#a67b4b",
    onPrimary: "#ffffff",
    secondary: "#7d6e6e",
    outline: "#5a5a5a",
    outlineVariant: "#c9bfb3",
    accent: "#d4a574",
  },
  typography: {
    bodyFamily: "var(--font-body)",
    displayFamily: "var(--font-body)",
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