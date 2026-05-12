"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useParams, useRouter, useSearchParams } from "next/navigation";
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

const toMediaDraft = (m: ProductImage): MediaDraft => ({
  clientId: m.id,
  id: m.id,
  previewUrl: m.image_url,
  media_type: m.media_type ?? "image",
  alt_text: m.alt_text ?? "",
  file_size: m.file_size,
  mime_type: m.mime_type,
  storage_path: m.storage_path,
  disk: m.disk,
});

export default function NewProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const { activeStore, isLoading: storeLoading } = useStore();
  const router = useRouter();
  const parentProductId = searchParams.get("parent_product_id") ?? "";
  const isVariantMode = parentProductId !== "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [parentProduct, setParentProduct] = useState<Product | null>(null);
  const [loadingParentProduct, setLoadingParentProduct] = useState(false);
  const [prefilledVariant, setPrefilledVariant] = useState(false);
  const [useParentImages, setUseParentImages] = useState(true);
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

  const loadCategories = useCallback(async () => {
    if (!activeStore?.slug) return;
    try {
      const res = await categoryApi.list(activeStore.slug);
      setCategories(res.categories);
    } catch {
      // non-critical
    }
  }, [activeStore]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, [loadCategories]);

  const loadParentProduct = useCallback(async () => {
    if (!slug || !isVariantMode || !parentProductId) return;

    setLoadingParentProduct(true);
    setError("");

    try {
      const res = await productApi.detail(slug, parentProductId);
      setParentProduct(res.product);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load parent product.");
    } finally {
      setLoadingParentProduct(false);
    }
  }, [slug, isVariantMode, parentProductId]);

  useEffect(() => {
    if (!isVariantMode) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadParentProduct();
  }, [isVariantMode, loadParentProduct]);

  useEffect(() => {
    if (!isVariantMode || !parentProduct || prefilledVariant) return;

    setForm({
      name: parentProduct.name,
      sku: "",
      category_id: parentProduct.category_id ?? "",
      price: String(parentProduct.price ?? ""),
      discount_type: parentProduct.discount_type ?? "",
      discount_value: parentProduct.discount_value ? String(parentProduct.discount_value) : "",
      stock: "",
      description: parentProduct.description ?? "",
      hs_code: parentProduct.hs_code ?? "",
      meta_title: parentProduct.meta_title ?? "",
      meta_description: parentProduct.meta_description ?? "",
      meta_keywords_csv: (parentProduct.meta_keywords ?? []).join(", "),
      tags_csv: (parentProduct.tags ?? []).map((t) => t.tag_name).join(", "),
    });

    const parentSpecifications = parentProduct.specifications ?? {};
    const loadedSpecifications = Object.entries(parentSpecifications).map(([key, value]) => ({
      id: makeId(),
      key,
      value: String(value),
    }));
    setSpecifications(loadedSpecifications.length > 0 ? loadedSpecifications : [createEmptySpecification()]);
    setMediaQueue((parentProduct.images ?? []).sort((a, b) => a.sort_order - b.sort_order).map(toMediaDraft));
    setPrefilledVariant(true);
  }, [isVariantMode, parentProduct, prefilledVariant]);

  const buildFormData = (): FormData => {
    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("sku", form.sku);
    if (form.category_id) payload.append("category_id", form.category_id);
    if (form.price !== "") payload.append("price", String(Number(form.price)));
    if (form.discount_type) payload.append("discount_type", form.discount_type);
    if (form.discount_value !== "") payload.append("discount_value", String(Number(form.discount_value)));
    if (form.stock !== "") payload.append("stock", String(Number(form.stock)));
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

    if (isVariantMode) {
      payload.append("copy_images", useParentImages ? "1" : "0");
      if (!useParentImages) {
        payload.append("media_present", "1");
        mediaQueue.forEach((item, sortIndex) => {
          if (item.file) {
            payload.append("media_uploads[]", item.file);
            payload.append("media_upload_orders[]", String(sortIndex));
            payload.append("media_upload_alt_texts[]", item.alt_text || "");
          }
        });
      }
    } else {
      payload.append("media_present", "1");
      mediaQueue.forEach((item, sortIndex) => {
        if (item.file) {
          payload.append("media_uploads[]", item.file);
          payload.append("media_upload_orders[]", String(sortIndex));
          payload.append("media_upload_alt_texts[]", item.alt_text || "");
        }
      });
    }

    return payload;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.slug) return;
    setSubmitting(true);
    setError("");
    const payload = buildFormData();

    try {
      if (isVariantMode && parentProductId) {
        await productApi.createVariant(activeStore.slug, parentProductId, payload);
        router.push(`/${slug}/product/${parentProductId}`);
      } else {
        await productApi.create(activeStore.slug, payload);
        router.push(`/${slug}/products`);
      }
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? (isVariantMode ? "Failed to create variant." : "Failed to create product."));
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

  const mediaCountLabel = `${mediaQueue.filter((i) => i.media_type === "image").length} image(s), ${mediaQueue.filter((i) => i.media_type === "video").length} video(s)`;

  if (storeLoading || loadingParentProduct) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }
  if (!activeStore) {
    return <Alert variant="warning">Select a store to add a product.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push(isVariantMode && parentProductId ? `/${slug}/product/${parentProductId}` : `/${slug}/products`)}
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          {isVariantMode ? "\u2190 Back to Product" : "\u2190 Back to Products"}
        </button>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-zinc-900">{isVariantMode ? "Create Variant" : "New Product"}</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {isVariantMode
            ? `Create a variant using ${parentProduct?.name ?? "the selected parent product"} as the base.`
            : `Add a new product to ${activeStore.name}.`}
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          {isVariantMode && parentProduct && (
            <div className="md:col-span-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              Parent product: <span className="font-medium text-zinc-900">{parentProduct.name}</span> ({parentProduct.sku})
            </div>
          )}

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
          <Input label="Stock" type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required={!isVariantMode} />
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
                    placeholder="size"
                  />
                </div>
                <div className="md:col-span-5">
                  <Input
                    label="Value"
                    value={item.value}
                    onChange={(e) => updateSpecification(item.id, "value", e.target.value)}
                    placeholder="B"
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
            {isVariantMode && (
              <div className="mb-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm font-medium text-zinc-900">Variant image source</p>
                <div className="mt-2 flex flex-col gap-2 text-sm text-zinc-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="variantImageSource"
                      checked={useParentImages}
                      onChange={() => setUseParentImages(true)}
                    />
                    Use images from parent product
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="variantImageSource"
                      checked={!useParentImages}
                      onChange={() => {
                        setUseParentImages(false);
                        setMediaQueue([]);
                      }}
                    />
                    Upload new images/videos for this variant
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">Product media</label>
              <span className="text-xs text-zinc-500">{useParentImages && isVariantMode ? `${parentProduct?.images?.length ?? 0} inherited` : mediaCountLabel}</span>
            </div>

            {(!isVariantMode || !useParentImages) && (
              <>
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
              </>
            )}

            {isVariantMode && useParentImages && (
              <p className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
                This variant will inherit media from the parent product. Switch to upload mode if you want separate media.
              </p>
            )}
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Button type="submit" loading={submitting}>{isVariantMode ? "Create Variant" : "Create Product"}</Button>
            <Button type="button" variant="secondary" onClick={() => router.push(isVariantMode && parentProductId ? `/${slug}/product/${parentProductId}` : `/${slug}/products`)}>
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
