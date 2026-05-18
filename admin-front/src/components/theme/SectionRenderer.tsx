"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { DynamicFormRenderer } from "@/components/theme/DynamicFormRenderer";
import type { ThemeSection } from "@/lib/types";

interface SectionRendererProps {
  id: string;
  index: number;
  section: ThemeSection;
  onSettingChange: (key: string, value: unknown) => void;
  onRemove: () => void;
}

export function SectionRenderer({
  id,
  index,
  section,
  onSettingChange,
  onRemove,
}: SectionRendererProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "opacity-80" : ""}
    >
      <Card className="border-zinc-200">
        <CardHeader className="mb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              aria-label="Drag section"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div>
              <CardTitle className="capitalize">{section.type.replace(/[-_]+/g, " ")}</CardTitle>
              <p className="text-xs text-zinc-500">Section #{index + 1}</p>
            </div>
          </div>

          <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-red-600">
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </CardHeader>

        <DynamicFormRenderer section={section} onSettingChange={onSettingChange} />
      </Card>
    </div>
  );
}
