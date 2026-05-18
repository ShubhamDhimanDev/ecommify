export const THEME_SUPPORT_ENV_KEY = "NEXT_PUBLIC_THEME_SUPPORT_ENABLED";

function parseBoolean(value: string | undefined): boolean {
  if (!value) {
    return true;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "0" || normalized === "false" || normalized === "off" || normalized === "no") {
    return false;
  }

  if (normalized === "1" || normalized === "true" || normalized === "on" || normalized === "yes") {
    return true;
  }

  return true;
}

export function isThemeSupportEnabled(): boolean {
  return parseBoolean(process.env.NEXT_PUBLIC_THEME_SUPPORT_ENABLED);
}
