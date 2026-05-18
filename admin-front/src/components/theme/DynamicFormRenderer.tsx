"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ThemeSection, ThemeSettingField } from "@/lib/types";

interface DynamicFormRendererProps {
  section: ThemeSection;
  onSettingChange: (key: string, value: unknown) => void;
}

type InferredFieldType = "text" | "textarea" | "number" | "boolean" | "color" | "media" | "array" | "json";

interface ResolvedField {
  key: string;
  label: string;
  type: InferredFieldType | "select";
  placeholder?: string;
  hint?: string;
  options?: Array<{ label: string; value: string }>;
  value: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function toLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferType(fieldKey: string, value: unknown, schemaType?: string): ResolvedField["type"] {
  if (schemaType === "select" || schemaType === "dropdown" || schemaType === "radio") {
    return "select";
  }

  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";

  if (Array.isArray(value)) return "array";
  if (isObject(value)) return "json";

  const key = fieldKey.toLowerCase();
  if (key.includes("image") || key.includes("media") || key.includes("banner") || key.includes("thumbnail")) {
    return "media";
  }

  if (key.includes("color")) {
    return "color";
  }

  if (key.includes("description") || key.includes("content")) {
    return "textarea";
  }

  return "text";
}

function normalizeFields(section: ThemeSection): ResolvedField[] {
  const settings = isObject(section.settings) ? section.settings : {};
  const schema = Array.isArray(section.settings_schema) ? section.settings_schema : [];

  if (schema.length > 0) {
    return schema.map((field: ThemeSettingField) => ({
      key: field.key,
      label: field.label ?? toLabel(field.key),
      type: inferType(field.key, settings[field.key], field.type),
      placeholder: field.placeholder,
      hint: field.hint,
      options: field.options,
      value: settings[field.key],
    }));
  }

  return Object.entries(settings).map(([key, value]) => ({
    key,
    label: toLabel(key),
    type: inferType(key, value),
    value,
  }));
}

export function DynamicFormRenderer({ section, onSettingChange }: DynamicFormRendererProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fields = useMemo(() => normalizeFields(section), [section]);

  if (fields.length === 0) {
    return <p className="text-sm text-zinc-500">No editable settings found for this section.</p>;
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const value = field.value;

        if (field.type === "boolean") {
          return (
            <label key={field.key} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onSettingChange(field.key, e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-zinc-700">{field.label}</span>
            </label>
          );
        }

        if (field.type === "select" && field.options?.length) {
          return (
            <Select
              key={field.key}
              label={field.label}
              value={typeof value === "string" ? value : ""}
              options={field.options}
              onChange={(e) => onSettingChange(field.key, e.target.value)}
            />
          );
        }

        if (field.type === "textarea") {
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">{field.label}</label>
              <textarea
                value={typeof value === "string" ? value : ""}
                onChange={(e) => onSettingChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="min-h-24 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              {field.hint && <p className="text-xs text-zinc-500">{field.hint}</p>}
            </div>
          );
        }

        if (field.type === "array") {
          const serialized = Array.isArray(value) ? value.join(", ") : "";
          return (
            <Input
              key={field.key}
              label={field.label}
              value={serialized}
              onChange={(e) => {
                const items = e.target.value
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter(Boolean);
                onSettingChange(field.key, items);
              }}
              hint="Comma-separated values"
            />
          );
        }

        if (field.type === "json") {
          const serialized = isObject(value) ? JSON.stringify(value, null, 2) : "{}";
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">{field.label}</label>
              <textarea
                value={serialized}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value) as Record<string, unknown>;
                    setFieldErrors((prev) => ({ ...prev, [field.key]: "" }));
                    onSettingChange(field.key, parsed);
                  } catch {
                    setFieldErrors((prev) => ({
                      ...prev,
                      [field.key]: "Invalid JSON. Keep typing to fix the syntax.",
                    }));
                  }
                }}
                className="min-h-28 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />
              {fieldErrors[field.key] && <p className="text-xs text-red-600">{fieldErrors[field.key]}</p>}
            </div>
          );
        }

        return (
          <Input
            key={field.key}
            type={field.type === "number" ? "number" : field.type === "color" ? "color" : "text"}
            label={field.label}
            value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
            placeholder={field.placeholder}
            hint={field.type === "media" ? "Paste a media URL." : field.hint}
            onChange={(e) => {
              if (field.type === "number") {
                onSettingChange(field.key, Number(e.target.value));
                return;
              }
              onSettingChange(field.key, e.target.value);
            }}
          />
        );
      })}
    </div>
  );
}
