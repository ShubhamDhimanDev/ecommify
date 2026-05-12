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
import { useStore } from "@/context/StoreContext";
import { ApiError, categoryApi, productApi } from "@/lib/api";
import type { Category, Product, ProductImage, ProductVariant } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { formatAmount, formatDate } from "@/lib/utils";

type VariantDraft = {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: string;
};

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

const makeId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export default function ProductsPage() {
  const { activeStore, isLoading: storeLoading } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    price: "",
    stock: "0",
    description: "",
    hs_code: "",
    tags_csv: "",
  });
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [mediaQueue, setMediaQueue] = useState<MediaDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));
  const categoryOptions = [{ value: "", label: "No category" }, ...categories.map((c) => ({ value: c.id, label: c.name }))];

  const loadData = useCallback(async (q?: string) => {
    if (!activeStore?.slug) return;

    setLoading(true);
    setError("");

    try {
      const [categoryRes, productRes] = await Promise.all([
        categoryApi.list(activeStore.slug),
        productApi.list(activeStore.slug, q ? { q } : undefined),
      ]);
      setCategories(categoryRes.categories);
      setProducts(productRes.data);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    if (!activeStore?.slug) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [activeStore?.slug, loadData]);

  const resetForm = () => {
    setMediaQueue((prev) => {
      prev.forEach((item) => {
        if (item.file) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });

    setVariants([]);
    setEditingId(null);
    setForm({
      name: "",
      sku: "",
      category_id: "",
      price: "",
      stock: "0",
      description: "",
      hs_code: "",
      tags_csv: "",
    });
  };

  const validateVariants = (): boolean => {
    const invalid = variants.some((variant) =>
      (variant.name.trim() !== "" || variant.sku.trim() !== "") &&
      (variant.name.trim() === "" || variant.sku.trim() === "")
    );

    if (invalid) {
      setError("Each variant row needs both Name and SKU.");
      return false;
    }

    return true;
  };

  const buildProductFormData = (): FormData | null => {
    if (!validateVariants()) return null;

    const payload = new FormData();

    payload.append("name", form.name);
    payload.append("sku", form.sku);
    if (form.category_id) payload.append("category_id", form.category_id);
    payload.append("price", String(Number(form.price)));
    payload.append("stock", String(Number(form.stock || "0")));
    if (form.description) payload.append("description", form.description);
    if (form.hs_code) payload.append("hs_code", form.hs_code);

    form.tags_csv
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag, i) => payload.append(`tags[${i}]`, tag));

    variants
      .filter((variant) => variant.name.trim() !== "" && variant.sku.trim() !== "")
      .forEach((variant, index) => {
        payload.append(`variants[${index}][name]`, variant.name.trim());
        payload.append(`variants[${index}][sku]`, variant.sku.trim());
        if (variant.price.trim() !== "") payload.append(`variants[${index}][price]`, String(Number(variant.price)));
        payload.append(`variants[${index}][stock]`, String(Number(variant.stock || "0")));
      });

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
    if (!activeStore?.slug) return;

    setSubmitting(true);
    setError("");

    const payload = buildProductFormData();
    if (!payload) {
      setSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        await productApi.update(activeStore.slug, editingId, payload);
      } else {
        await productApi.create(activeStore.slug, payload);
      }

      resetForm();
      await loadData(search || undefined);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id ?? "",
      price: String(product.price),
      stock: String(product.stock),
      description: product.description ?? "",
      hs_code: product.hs_code ?? "",
      tags_csv: (product.tags ?? []).map((tag) => tag.tag_name).join(", "),
    });

    setVariants((product.variants ?? []).map(toVariantDraft));
    setMediaQueue((product.images ?? []).sort((a, b) => a.sort_order - b.sort_order).map(toMediaDraft));
  };

  const remove = async (id: string) => {
    if (!activeStore?.slug) return;
    setError("");

    try {
      await productApi.remove(activeStore.slug, id);
      await loadData(search || undefined);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to delete product.");
    }
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, { id: makeId(), name: "", sku: "", price: "", stock: "0" }]);
  };

  const updateVariant = (id: string, patch: Partial<VariantDraft>) => {
    setVariants((prev) => prev.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const handleMediaFiles = (files: FileList | null) => {
    if (!files) return;

    const accepted = Array.from(files)
      .filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"))
      .map((file) => ({
        clientId: makeId(),
        file,
        previewUrl: URL.createObjectURL(file),
        media_type: file.type.startsWith("video/") ? ("video" as const) : ("image" as const),
        alt_text: "",
        file_size: file.size,
        mime_type: file.type || null,
        storage_path: null,
        disk: "public",
      }));

    setMediaQueue((prev) => [...prev, ...accepted]);
  };

  const removeMediaItem = (clientId: string) => {
    setMediaQueue((prev) => {
      const target = prev.find((item) => item.clientId === clientId);
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.clientId !== clientId);
    });
  };

  const updateMediaAlt = (clientId: string, value: string) => {
    setMediaQueue((prev) => prev.map((item) => (item.clientId === clientId ? { ...item, alt_text: value } : item)));
  };

  const onMediaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setMediaQueue((items) => {
      const oldIndex = items.findIndex((item) => item.clientId === active.id);
      const newIndex = items.findIndex((item) => item.clientId === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const mediaCountLabel = useMemo(() => {
    const imageCount = mediaQueue.filter((item) => item.media_type === "image").length;
    const videoCount = mediaQueue.filter((item) => item.media_type === "video").length;
    return `${imageCount} image(s), ${videoCount} video(s)`;
  }, [mediaQueue]);

  if (storeLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!activeStore) {
    return <Alert variant="warning">Select a store to manage products.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Products</h2>
        <p className="mt-1 text-sm text-zinc-500">Manage products for {activeStore.name}.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit product" : "Create product"}</CardTitle>
        </CardHeader>

        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="SKU" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} required />
          <Select label="Category" value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} options={categoryOptions} />
          <Input label="Price" type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
          <Input label="Stock" type="number" min="0" value={form.stock} onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))} required />
          <Input label="HS Code" value={form.hs_code} onChange={(e) => setForm((p) => ({ ...p, hs_code: e.target.value }))} />

          <div className="md:col-span-3">
            <Input label="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
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
              <p className="text-xs text-zinc-500">Uploaded files are saved under /storage/{activeStore.slug}/products/</p>
            </div>

            {mediaQueue.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-zinc-300 p-4 text-xs text-zinc-500">
                No media added yet. Add images or videos, then drag to sort display order.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onMediaDragEnd}>
                  <SortableContext items={mediaQueue.map((item) => item.clientId)} strategy={verticalListSortingStrategy}>
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

          <div className="md:col-span-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-zinc-700">Product variants</label>
              <Button type="button" size="sm" variant="secondary" onClick={addVariant}>
                <Plus size={14} />
                Add variant
              </Button>
            </div>

            {variants.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-zinc-300 p-4 text-xs text-zinc-500">
                No variants yet. Add rows like size/color options with SKU, price and stock.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {variants.map((variant) => (
                  <div key={variant.id} className="grid gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-12">
                    <div className="md:col-span-3">
                      <Input
                        placeholder="Variant name"
                        value={variant.name}
                        onChange={(e) => updateVariant(variant.id, { name: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <Input
                        placeholder="SKU"
                        value={variant.sku}
                        onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) => updateVariant(variant.id, { price: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Stock"
                        value={variant.stock}
                        onChange={(e) => updateVariant(variant.id, { stock: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end">
                      <Button type="button" size="sm" variant="danger" onClick={() => removeVariant(variant.id)}>
                        <Trash2 size={14} />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-3 flex items-center gap-2">
            <Button type="submit" loading={submitting}>{editingId ? "Update" : "Create"}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product list</CardTitle>
          <div className="w-72">
            <Input
              placeholder="Search by name or SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void loadData(search || undefined);
                }
              }}
            />
          </div>
        </CardHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <Table>
            <TableHead>
              <Th>Name</Th>
              <Th>SKU</Th>
              <Th>Price</Th>
              <Th>Stock</Th>
              <Th>Variants</Th>
              <Th>Media</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableEmpty message="No products found." />
              ) : (
                products.map((product) => (
                  <Tr key={product.id}>
                    <Td>{product.name}</Td>
                    <Td>{product.sku}</Td>
                    <Td>{formatAmount(product.price)}</Td>
                    <Td>{product.stock}</Td>
                    <Td>{product.variants?.length ?? 0}</Td>
                    <Td>{product.images?.length ?? 0}</Td>
                    <Td>{formatDate(product.created_at)}</Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(product)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => remove(product.id)}>Delete</Button>
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </TableBody>
          </Table>
        )}
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="grid gap-3 md:grid-cols-12">
        <div className="md:col-span-1 flex items-center justify-center">
          <button
            type="button"
            className="cursor-grab rounded border border-zinc-200 p-2 text-zinc-500"
            {...attributes}
            {...listeners}
            aria-label="Drag media item"
          >
            <GripVertical size={16} />
          </button>
        </div>

        <div className="md:col-span-2 text-xs text-zinc-500 flex items-center">
          #{index + 1}
        </div>

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
          <Input
            label="Alt text"
            value={item.alt_text}
            onChange={(e) => onAltChange(item.clientId, e.target.value)}
            placeholder="Describe this media"
          />
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

function toMediaDraft(media: ProductImage): MediaDraft {
  return {
    clientId: media.id,
    id: media.id,
    previewUrl: media.image_url,
    media_type: media.media_type ?? "image",
    alt_text: media.alt_text ?? "",
    file_size: media.file_size,
    mime_type: media.mime_type,
    storage_path: media.storage_path,
    disk: media.disk,
  };
}

function toVariantDraft(variant: ProductVariant): VariantDraft {
  return {
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    price: variant.price ?? "",
    stock: String(variant.stock),
  };
}
