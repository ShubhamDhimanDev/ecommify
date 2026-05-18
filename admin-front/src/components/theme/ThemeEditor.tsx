"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";
import { DragDropProvider } from "@/components/theme/DragDropProvider";
import { SectionRenderer } from "@/components/theme/SectionRenderer";
import { useThemeEditor } from "@/hooks/useThemeEditor";

function previewPathForPage(pageKey: string): string {
  switch (pageKey) {
    case "home":
    case "header":
    case "footer":
      return "";
    case "product-list":
      return "/products";
    case "product-detail":
      return "/products";
    case "cart":
      return "/cart";
    case "checkout":
      return "/checkout";
    default:
      return "";
  }
}

interface ThemeEditorProps {
  slug: string;
}

export function ThemeEditor({ slug }: ThemeEditorProps) {
  const [nextSectionType, setNextSectionType] = useState("");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);

  const {
    activeTheme,
    pageKeys,
    activePageKey,
    setActivePageKey,
    sections,
    sectionIds,
    availableTemplates,
    loading,
    saving,
    error,
    message,
    isDirty,
    save,
    addSection,
    removeSection,
    reorderSectionsById,
    updateSetting,
  } = useThemeEditor({
    slug,
    autoSaveMs: autoSaveEnabled ? 1200 : 0,
  });

  const sectionOptions = useMemo(
    () =>
      availableTemplates.map((entry) => ({
        value: entry.type,
        label: entry.type.replace(/[-_]+/g, " "),
      })),
    [availableTemplates]
  );

  const basePreviewUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL;
  const pagePath = previewPathForPage(activePageKey);
  const previewUrl =
    basePreviewUrl && activeTheme?.theme.code
      ? `${basePreviewUrl.replace(/\/$/, "")}/${slug}${pagePath}?preview_theme=${encodeURIComponent(activeTheme.theme.code)}&preview_page=${encodeURIComponent(activePageKey)}`
      : null;

  const pageOptions = pageKeys.map((page) => ({
    value: page,
    label: page.replace(/[-_]+/g, " "),
  }));

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!activeTheme) {
    return (
      <Alert variant="warning">
        No active theme found for this store. Activate a theme from{" "}
        <Link href={`/${slug}/themes`} className="underline font-medium">
          theme selector
        </Link>
        .
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error.message}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Card>
        <CardHeader className="mb-4">
          <div>
            <CardTitle>Theme editor</CardTitle>
            <p className="text-sm text-zinc-500 mt-1">
              Editing {activeTheme.theme.name} ({activeTheme.theme.code}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600">
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300 text-primary-600"
              />
              Auto-save
            </label>

            <Button type="button" variant="secondary" onClick={() => void save()} loading={saving}>
              {saving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </CardHeader>

        <div className="grid gap-3 md:grid-cols-3">
          <Select
            label="Page"
            value={activePageKey}
            options={pageOptions}
            onChange={(e) => setActivePageKey(e.target.value)}
          />
          <Select
            label="Add section"
            value={nextSectionType}
            options={sectionOptions}
            placeholder="Choose section type"
            onChange={(e) => setNextSectionType(e.target.value)}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              disabled={!nextSectionType}
              onClick={() => {
                addSection(nextSectionType);
                setNextSectionType("");
              }}
            >
              Add section
            </Button>
          </div>
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          {isDirty ? "You have unsaved changes." : "All changes are saved."}
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {sections.length === 0 ? (
            <Card>
              <p className="text-sm text-zinc-500">No sections configured for this page.</p>
            </Card>
          ) : (
            <DragDropProvider itemIds={sectionIds} onReorder={reorderSectionsById}>
              <div className="space-y-3">
                {sections.map((section, index) => {
                  const sectionId = sectionIds[index] ?? `${section.type}-${index}`;
                  return (
                    <SectionRenderer
                      key={sectionId}
                      id={sectionId}
                      index={index}
                      section={section}
                      onSettingChange={(key, value) => updateSetting(index, key, value)}
                      onRemove={() => removeSection(index)}
                    />
                  );
                })}
              </div>
            </DragDropProvider>
          )}
        </div>

        {previewUrl && (
          <Card padding="sm" className="h-fit">
            <p className="mb-3 text-sm font-medium text-zinc-800">Live preview</p>
            <iframe
              title="Storefront preview"
              src={previewUrl}
              className="h-[620px] w-full rounded-lg border border-zinc-200"
            />
          </Card>
        )}
      </div>
    </div>
  );
}
