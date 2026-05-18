import { useCallback, useEffect, useState } from "react";
import { ApiError, themeApi } from "@/lib/api";
import type { ActiveThemePayload, ThemeCatalogItem } from "@/lib/types";

interface UseThemeOptions {
  slug: string;
  onError?: (error: Error) => void;
  onSuccess?: (message: string) => void;
}

export function useTheme(options: UseThemeOptions) {
  const { slug, onError, onSuccess } = options;

  const [themes, setThemes] = useState<ThemeCatalogItem[]>([]);
  const [activeTheme, setActiveTheme] = useState<ActiveThemePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [activatingThemeId, setActivatingThemeId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchThemes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [themeList, storeTheme] = await Promise.all([
        themeApi.list(),
        themeApi
          .getStoreTheme(slug)
          .then((res) => res.data)
          .catch((err: unknown) => {
            const apiError = err as ApiError;
            if (apiError?.status === 404) {
              return null;
            }
            throw err;
          }),
      ]);

      setThemes(themeList.data);
      setActiveTheme(storeTheme);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to fetch themes.");
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [onError, slug]);

  const activateTheme = useCallback(
    async (themeId: string) => {
      try {
        setActivatingThemeId(themeId);
        setError(null);

        const response = await themeApi.activate(slug, themeId);
        setActiveTheme(response.data);

        onSuccess?.(response.message);
        return response.data;
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error("Failed to activate theme.");
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setActivatingThemeId(null);
      }
    },
    [onError, onSuccess, slug]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchThemes();
  }, [fetchThemes]);

  const activeThemeId = activeTheme?.theme.id ?? null;

  return {
    themes,
    activeTheme,
    activeThemeId,
    loading,
    activatingThemeId,
    error,
    fetchThemes,
    activateTheme,
  };
}
