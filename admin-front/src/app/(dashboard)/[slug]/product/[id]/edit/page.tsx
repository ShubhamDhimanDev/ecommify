"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageIcon, Plus, Trash2, Video } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { ApiError, categoryApi, productApi } from "@/lib/api";
import type { Category, Product, ProductImage } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";

type MediaDraft = {
  clientId: string;
  id?: string;
  file?: File;
  previewUrl: string;
  media_type: "image" | "video";
  alt_text: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string | null;
  disk: string | null;
};

type SpecificationDraft = {
  id: string;
  key: string;
  value: string;
};

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createEmptySpecification = (): SpecificationDraft => ({
  id: makeId(),
  key: "",
  value: "",
});

function toMediaDraft(m: ProductImage): MediaDraft {
  return {
    clientId: m.id,
    id: m.id,
    previewUrl: m.image_url,
    media_type: m.media_type ?? "image",
    alt_text: m.alt_text ?? "",
    file_size: m.file_size,
    mime_type: m.mime_type,
    storage_path: m.storage_path,
    disk: m.disk,
  };
}

export default function EditProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const { activeStore, isLoading: storeLoading } = useStore();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    price: "",
    discount_type: "",
    discount_value: "",
    stock: "0",
    description: "",
    hs_code: "",
    meta_title: "",
    meta_description: "",
    meta_keywords_csv: "",
    tags_csv: "",
  });
  const [mediaQueue, setMediaQueue] = useState<MediaDraft[]>([]);
  const [specifications, setSpecifications] = useState<SpecificationDraft[]>([createEmptySpecification()]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const categoryOptions = [
    { value: "", label: "No category" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const loadData = useCallback(async () => {
    if (!slug || !id) return;
    setLoadingProduct(true);
    setError("");
    try {
      const [catRes, prodRes] = await Promise.all([
        categoryApi.list(slug),
        productApi.detail(slug, id),
      ]);
      setCategories(catRes.categories);
      const p = prodRes.product;
      setForm({
        name: p.name,
        sku: p.sku,
        category_id: p.category_id ?? "",
        price: String(p.price),
        discount_type: p.discount_type ?? "",
        discount_value: p.discount_value ? String(p.discount_value) : "",
        stock: String(p.stock),
        description: p.description ?? "",
        hs_code: p.hs_code ?? "",
        meta_title: p.meta_title ?? "",
        meta_description: p.meta_description ?? "",
        meta_keywords_csv: (p.meta_keywords ?? []).join(", "),
        tags_csv: (p.tags ?? []).map((t) => t.tag_name).join(", "),
      });
      setMediaQueue(
        (p.images ?? []).sort((a, b) => a.sort_order - b.sort_order).map(toMediaDraft)
      );
      const productSpecifications = (p as { specifications?: Record<string, string> | null }).specifications;
      const loadedSpecifications = Object.entries(productSpecifications ?? {}).map(([key, value]) => ({
        id: makeId(),
        key,
        value: String(value),
      }));
      setSpecifications(loadedSpecifications.length > 0 ? loadedSpecifications : [createEmptySpecification()]);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load product.");
    } finally {
      setLoadingProduct(false);
    }
  }, [slug, id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const buildFormData = (): FormData => {
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("sku", form.sku);
    if (form.category_id) payload.append("category_id", form.category_id);
    payload.append("price", String(Number(form.price)));
    if (form.discount_type) {
      payload.append("discount_type", form.discount_type);
      if (form.discount_value !== "") payload.append("discount_value", String(Number(form.discount_value)));
    } else {
      payload.append("discount_type", "");
      payload.append("discount_value", "");
    }
    payload.append("stock", String(Number(form.stock || "0")));
    if (form.description) payload.append("description", form.description);
    if (form.hs_code) payload.append("hs_code", form.hs_code);
    if (form.meta_title) payload.append("meta_title", form.meta_title);
    if (form.meta_description) payload.append("meta_description", form.meta_description);
    form.meta_keywords_csv
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .forEach((keyword, i) => payload.append(`meta_keywords[${i}]`, keyword));

    let specificationCount = 0;
    specifications.forEach((item) => {
      const key = item.key.trim();
      const value = item.value.trim();
      if (!key || !value) return;
      payload.append(`specifications[${key}]`, value);
      specificationCount += 1;
    });
    if (specificationCount === 0) {
      payload.append("specifications[__empty]", "");
    }

    form.tags_csv
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((tag, i) => payload.append(`tags[${i}]`, tag));

    payload.append("media_present", "1");

    let persistedIndex = 0;
    mediaQueue.forEach((item, sortIndex) => {
      if (item.file) {
        payload.append("media_uploads[]", item.file);
        payload.append("media_upload_orders[]", String(sortIndex));
        payload.append("media_upload_alt_texts[]", item.alt_text || "");
        return;
      }
      payload.append(`media[${persistedIndex}][id]`, item.id ?? "");
      payload.append(`media[${persistedIndex}][image_url]`, item.previewUrl);
      payload.append(`media[${persistedIndex}][media_type]`, item.media_type);
      payload.append(`media[${persistedIndex}][sort_order]`, String(sortIndex));
      payload.append(`media[${persistedIndex}][alt_text]`, item.alt_text || "");
      if (item.mime_type) payload.append(`media[${persistedIndex}][mime_type]`, item.mime_type);
      if (item.file_size !== null) payload.append(`media[${persistedIndex}][file_size]`, String(item.file_size));
      if (item.storage_path) payload.append(`media[${persistedIndex}][storage_path]`, item.storage_path);
      if (item.disk) payload.append(`media[${persistedIndex}][disk]`, item.disk);
      persistedIndex += 1;
    });

    return payload;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setSubmitting(true);
    setError("");
    const payload = buildFormData();

    try {
      await productApi.update(slug, id, payload);
      router.push(`/${slug}/product/${id}`);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMediaFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files)
      .filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
      .map((f) => ({
        clientId: makeId(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        media_type: f.type.startsWith("video/") ? ("video" as const) : ("image" as const),
        alt_text: "",
        file_size: f.size,
        mime_type: f.type || null,
        storage_path: null,
        disk: "public",
      }));
    setMediaQueue((prev) => [...prev, ...accepted]);
  };

  const removeMediaItem = (clientId: string) =>
    setMediaQueue((prev) => {
      const target = prev.find((item) => item.clientId === clientId);
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.clientId !== clientId);
    });

  const updateMediaAlt = (clientId: string, value: string) =>
    setMediaQueue((prev) =>
      prev.map((item) => (item.clientId === clientId ? { ...item, alt_text: value } : item))
    );

  const onMediaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setMediaQueue((items) => {
      const oldIdx = items.findIndex((i) => i.clientId === active.id);
      const newIdx = items.findIndex((i) => i.clientId === over.id);
      if (oldIdx === -1 || newIdx === -1) return items;
      return arrayMove(items, oldIdx, newIdx);
    });
  };

  const updateSpecification = (id: string, field: "key" | "value", value: string) => {
    setSpecifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addSpecificationRow = () => {
    setSpecifications((prev) => [...prev, createEmptySpecification()]);
  };

  const removeSpecificationRow = (id: string) => {
    setSpecifications((prev) => {
      if (prev.length === 1) {
        return [createEmptySpecification()];
      }

      return prev.filter((item) => item.id !== id);
    });
  };

  const mediaCountLabel = useMemo(
    () =>
      `${mediaQueue.filter((i) => i.media_type === "image").length} image(s), ${mediaQueue.filter((i) => i.media_type === "video").length} video(s)`,
    [mediaQueue]
  );

  if (storeLoading || loadingProduct) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  if (!activeStore) {
    return <Alert variant="warning">Select a store to edit this product.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push(`/${slug}/product/${id}`)}
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          &larr; Back to Product
        </button>
        <Button type="button" variant="secondary" onClick={() => router.push(`/${slug}/products/new?parent_product_id=${id}`)}>
          Create Variant
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Edit Product</h2>
        <p className="mt-1 text-sm text-zinc-500">Update product details for {activeStore.name}.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="SKU" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} required />
          <Select label="Category" value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} options={categoryOptions} />
          <Input label="Price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
          <Select
            label="Discount type"
            value={form.discount_type}
            onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value, discount_value: e.target.value ? p.discount_value : "" }))}
            options={[
              { value: "", label: "None" },
              { value: "fixed", label: "Fixed amount" },
              { value: "percentage", label: "Percentage" },
            ]}
          />
          <Input
            label={form.discount_type === "percentage" ? "Discount (%)" : "Discount amount"}
            type="number"
            step="0.01"
            min="0"
            max={form.discount_type === "percentage" ? "100" : undefined}
            value={form.discount_value}
            onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
            disabled={!form.discount_type}
            hint={form.discount_type === "percentage" ? "Max 100%" : form.discount_type === "fixed" ? `Sale price: ${(Number(form.price || 0) - Number(form.discount_value || 0)).toFixed(2)}` : undefined}
          />
          <Input label="Stock" type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required />
          <Input label="HS Code" value={form.hs_code} onChange={(e) => setForm((p) => ({ ...p, hs_code: e.target.value }))} />

          <div className="md:col-span-3">
            <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>

          <div className="md:col-span-3">
            <Input label="Meta title" value={form.meta_title} onChange={(e) => setForm((p) => ({ ...p, meta_title: e.target.value }))} placeholder="SEO title for product page" />
          </div>

          <div className="md:col-span-3">
            <Input label="Meta description" value={form.meta_description} onChange={(e) => setForm((p) => ({ ...p, meta_description: e.target.value }))} placeholder="SEO description" />
          </div>

          <div className="md:col-span-3">
            <Input label="Meta keywords" value={form.meta_keywords_csv} onChange={(e) => setForm((p) => ({ ...p, meta_keywords_csv: e.target.value }))} placeholder="shoes, running, men" hint="Comma-separated keywords" />
          </div>

          <div className="md:col-span-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">Specifications</label>
              <Button type="button" size="sm" variant="secondary" onClick={addSpecificationRow}>
                <Plus size={14} />
                Add specification
              </Button>
            </div>

            {specifications.map((item) => (
              <div key={item.id} className="grid gap-2 md:grid-cols-12">
                <div className="md:col-span-5">
                  <Input
                    label="Key"
                    value={item.key}
                    onChange={(e) => updateSpecification(item.id, "key", e.target.value)}
                    placeholder="color"
                  />
                </div>
                <div className="md:col-span-5">
                  <Input
                    label="Value"
                    value={item.value}
                    onChange={(e) => updateSpecification(item.id, "value", e.target.value)}
                    placeholder="red"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <Button type="button" variant="danger" size="sm" onClick={() => removeSpecificationRow(item.id)}>
                    <Trash2 size={14} />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-3">
            <Input
              label="Tags"
              value={form.tags_csv}
              onChange={(e) => setForm((p) => ({ ...p, tags_csv: e.target.value }))}
              placeholder="summer, bestseller, electronics"
              hint="Comma-separated tags"
            />
          </div>

          {/* Media */}
          <div className="md:col-span-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">Product media</label>
              <span className="text-xs text-zinc-500">{mediaCountLabel}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => handleMediaFiles(e.target.files)}
              />
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <Plus size={14} />
                Add images/videos
              </Button>
              <p className="text-xs text-zinc-500">
                Files saved under /storage/{activeStore.slug}/products/
              </p>
            </div>

            {mediaQueue.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-4 text-xs text-zinc-500">
                No media added yet. Add images or videos, then drag to sort display order.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onMediaDragEnd}>
                  <SortableContext items={mediaQueue.map((i) => i.clientId)} strategy={verticalListSortingStrategy}>
                    {mediaQueue.map((item, index) => (
                      <SortableMediaItem
                        key={item.clientId}
                        item={item}
                        index={index}
                        onAltChange={updateMediaAlt}
                        onRemove={removeMediaItem}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Button type="submit" loading={submitting}>Update Product</Button>
            <Button type="button" variant="secondary" onClick={() => router.push(`/${slug}/product/${id}`)}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function SortableMediaItem({
  item,
  index,
  onAltChange,
  onRemove,
}: {
  item: MediaDraft;
  index: number;
  onAltChange: (clientId: string, value: string) => void;
  onRemove: (clientId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.clientId });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-1 flex items-center justify-center">
          <button type="button" className="cursor-grab rounded border border-zinc-200 p-2 text-zinc-500" {...attributes} {...listeners} aria-label="Drag media item">
            <GripVertical size={16} />
          </button>
        </div>
        <div className="md:col-span-2 text-xs text-zinc-500 flex items-center">#{index + 1}</div>
        <div className="md:col-span-3">
          <div className="h-20 w-full overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
            {item.media_type === "video" ? (
              <video src={item.previewUrl} className="h-full w-full object-cover" controls muted />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.previewUrl} alt={item.alt_text || "product media"} className="h-full w-full object-cover" />
            )}
          </div>
        </div>
        <div className="md:col-span-4">
          <Input label="Alt text" value={item.alt_text} onChange={(e) => onAltChange(item.clientId, e.target.value)} placeholder="Describe this media" />
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            {item.media_type === "video" ? <Video size={14} /> : <ImageIcon size={14} />}
            <span>{item.mime_type ?? item.media_type}</span>
          </div>
        </div>
        <div className="md:col-span-2 flex items-center justify-end">
          <Button type="button" size="sm" variant="danger" onClick={() => onRemove(item.clientId)}>
            <Trash2 size={14} />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
