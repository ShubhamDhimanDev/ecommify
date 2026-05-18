import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { themeApi } from "@/lib/api";
import type {
  ActiveThemePayload,
  ThemeConfig,
  ThemeCustomConfig,
  ThemePageConfig,
  ThemeSection,
} from "@/lib/types";

interface UseThemeEditorOptions {
  slug: string;
  initialPageKey?: string;
  autoSaveMs?: number;
  onError?: (error: Error) => void;
  onSaveSuccess?: (message: string) => void;
}

interface TemplateSection {
  type: string;
  template: ThemeSection;
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (isObject(a) && isObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
}

function buildOverrides(baseValue: unknown, editedValue: unknown): unknown {
  if (deepEqual(baseValue, editedValue)) {
    return undefined;
  }

  if (Array.isArray(baseValue) && Array.isArray(editedValue)) {
    return editedValue;
  }

  if (isObject(baseValue) && isObject(editedValue)) {
    const diff: Record<string, unknown> = {};

    for (const [key, nextValue] of Object.entries(editedValue)) {
      const childDiff = buildOverrides(baseValue[key], nextValue);
      if (childDiff !== undefined) {
        diff[key] = childDiff;
      }
    }

    return Object.keys(diff).length ? diff : undefined;
  }

  return editedValue;
}

function makeEditorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getPageConfig(config: ThemeConfig, pageKey: string): ThemePageConfig | null {
  const pages = config.pages;
  if (!pages || !isObject(pages)) return null;

  const pageConfig = pages[pageKey];
  return pageConfig && isObject(pageConfig) ? pageConfig : null;
}

function getPageSections(config: ThemeConfig, pageKey: string): ThemeSection[] {
  const pageConfig = getPageConfig(config, pageKey);
  if (!pageConfig || !Array.isArray(pageConfig.sections)) return [];

  return pageConfig.sections.filter((section): section is ThemeSection => isObject(section));
}

function setPageSections(config: ThemeConfig, pageKey: string, sections: ThemeSection[]): ThemeConfig {
  const next = deepClone(config);
  const pages = isObject(next.pages) ? next.pages : {};
  const currentPage = isObject(pages[pageKey]) ? pages[pageKey] : {};

  next.pages = {
    ...pages,
    [pageKey]: {
      ...currentPage,
      sections,
    },
  };

  return next;
}

function collectSectionTemplates(config: ThemeConfig): Record<string, TemplateSection[]> {
  const pages = config.pages;
  if (!pages || !isObject(pages)) return {};

  const result: Record<string, TemplateSection[]> = {};

  for (const [pageKey, pageConfig] of Object.entries(pages)) {
    if (!isObject(pageConfig) || !Array.isArray(pageConfig.sections)) {
      result[pageKey] = [];
      continue;
    }

    const templatesByType = new Map<string, ThemeSection>();

    pageConfig.sections.forEach((section) => {
      if (!isObject(section)) return;
      if (typeof section.type !== "string" || !section.type) return;

      if (!templatesByType.has(section.type)) {
        templatesByType.set(section.type, deepClone(section as ThemeSection));
      }
    });

    result[pageKey] = Array.from(templatesByType.entries()).map(([type, template]) => ({
      type,
      template,
    }));
  }

  return result;
}

export function useThemeEditor(options: UseThemeEditorOptions) {
  const { slug, initialPageKey, autoSaveMs, onError, onSaveSuccess } = options;

  const [activeTheme, setActiveTheme] = useState<ActiveThemePayload | null>(null);
  const [baselineConfig, setBaselineConfig] = useState<ThemeConfig | null>(null);
  const [draftConfig, setDraftConfig] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [message, setMessage] = useState<string>("");
  const [activePageKey, setActivePageKey] = useState(initialPageKey ?? "home");
  const [sectionIds, setSectionIds] = useState<string[]>([]);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrateEditorState = useCallback(
    (payload: ActiveThemePayload) => {
      const mergedConfig = deepClone(payload.config ?? {});
      setBaselineConfig(mergedConfig);
      setActiveTheme(payload);
      setDraftConfig(mergedConfig);

      const availablePages = Object.keys(payload.config?.pages ?? {});
      const preferredPage =
        initialPageKey && availablePages.includes(initialPageKey)
          ? initialPageKey
          : availablePages.includes(activePageKey)
            ? activePageKey
            : availablePages[0] ?? "home";

      setActivePageKey(preferredPage);

      const sections = getPageSections(mergedConfig, preferredPage);
      setSectionIds(sections.map(() => makeEditorId()));
    },
    [activePageKey, initialPageKey]
  );

  const fetchTheme = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await themeApi.getStoreTheme(slug);
      hydrateEditorState(response.data);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to fetch active theme.");
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [hydrateEditorState, onError, slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTheme();
  }, [fetchTheme]);

  const pageKeys = useMemo(() => {
    if (!draftConfig?.pages) return [];
    return Object.keys(draftConfig.pages);
  }, [draftConfig]);

  const sections = useMemo(() => {
    if (!draftConfig) return [];
    return getPageSections(draftConfig, activePageKey);
  }, [activePageKey, draftConfig]);

  const templatesByPage = useMemo(() => {
    if (!baselineConfig) return {};
    return collectSectionTemplates(baselineConfig);
  }, [baselineConfig]);

  const availableTemplates = useMemo(
    () => templatesByPage[activePageKey] ?? [],
    [activePageKey, templatesByPage]
  );

  const maxSectionsFromSchema = useMemo(() => {
    const baseline = baselineConfig;
    return baseline ? getPageSections(baseline, activePageKey).length : Infinity;
  }, [activePageKey, baselineConfig]);

  const overrides = useMemo(() => {
    if (!baselineConfig || !draftConfig) return {};

    const diff = buildOverrides(baselineConfig, draftConfig);
    return (isObject(diff) ? diff : {}) as ThemeCustomConfig;
  }, [baselineConfig, draftConfig]);

  const isDirty = useMemo(() => Object.keys(overrides).length > 0, [overrides]);

  const save = useCallback(async () => {
    if (!isDirty) return;

    try {
      setSaving(true);
      setError(null);

      const response = await themeApi.updateConfig(slug, overrides);
      hydrateEditorState(response.data);
      setMessage(response.message);
      onSaveSuccess?.(response.message);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to save theme configuration.");
      setError(error);
      onError?.(error);
    } finally {
      setSaving(false);
    }
  }, [hydrateEditorState, isDirty, onError, onSaveSuccess, overrides, slug]);

  useEffect(() => {
    if (!autoSaveMs || autoSaveMs <= 0) return;
    if (!isDirty || saving) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      void save();
    }, autoSaveMs);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [autoSaveMs, isDirty, save, saving]);

  const replaceSections = useCallback(
    (nextSections: ThemeSection[], nextSectionIds?: string[]) => {
      setDraftConfig((prev) => {
        if (!prev) return prev;
        return setPageSections(prev, activePageKey, nextSections);
      });

      if (nextSectionIds) {
        setSectionIds(nextSectionIds);
      }
    },
    [activePageKey]
  );

  const changeActivePageKey = useCallback(
    (pageKey: string) => {
      setActivePageKey(pageKey);

      if (!draftConfig) {
        setSectionIds([]);
        return;
      }

      const nextSections = getPageSections(draftConfig, pageKey);
      setSectionIds(nextSections.map(() => makeEditorId()));
    },
    [draftConfig]
  );

  const reorderSectionsById = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;

      const from = sectionIds.indexOf(activeId);
      const to = sectionIds.indexOf(overId);
      if (from < 0 || to < 0) return;

      const nextSections = [...sections];
      const [movedSection] = nextSections.splice(from, 1);
      nextSections.splice(to, 0, movedSection);

      const nextIds = [...sectionIds];
      const [movedId] = nextIds.splice(from, 1);
      nextIds.splice(to, 0, movedId);

      replaceSections(nextSections, nextIds);
      setMessage("");
    },
    [replaceSections, sectionIds, sections]
  );

  const updateSection = useCallback(
    (index: number, updater: (section: ThemeSection) => ThemeSection) => {
      const nextSections = sections.map((section, i) =>
        i === index ? updater(deepClone(section)) : section
      );

      replaceSections(nextSections);
      setMessage("");
    },
    [replaceSections, sections]
  );

  const updateSetting = useCallback(
    (index: number, key: string, value: unknown) => {
      updateSection(index, (section) => {
        const currentSettings = isObject(section.settings) ? section.settings : {};
        return {
          ...section,
          settings: {
            ...currentSettings,
            [key]: value,
          },
        };
      });
    },
    [updateSection]
  );

  const addSection = useCallback(
    (type: string) => {
      if (!type) return;

      if (sections.length >= maxSectionsFromSchema) {
        setError(
          new Error(
            "This theme schema does not allow adding more sections on this page."
          )
        );
        return;
      }

      const template = availableTemplates.find((entry) => entry.type === type)?.template;
      if (!template) {
        setError(new Error("Selected section template is unavailable."));
        return;
      }

      const nextSections = [...sections, deepClone(template)];
      const nextIds = [...sectionIds, makeEditorId()];
      replaceSections(nextSections, nextIds);
      setMessage("");
    },
    [availableTemplates, maxSectionsFromSchema, replaceSections, sectionIds, sections]
  );

  const removeSection = useCallback(
    (index: number) => {
      const nextSections = sections.filter((_, i) => i !== index);
      const nextIds = sectionIds.filter((_, i) => i !== index);

      replaceSections(nextSections, nextIds);
      setMessage("");
    },
    [replaceSections, sectionIds, sections]
  );

  return {
    activeTheme,
    draftConfig,
    pageKeys,
    activePageKey,
    setActivePageKey: changeActivePageKey,
    sections,
    sectionIds,
    availableTemplates,
    loading,
    saving,
    error,
    message,
    overrides,
    isDirty,
    fetchTheme,
    save,
    addSection,
    removeSection,
    reorderSectionsById,
    updateSection,
    updateSetting,
  };
}
