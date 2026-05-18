"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { DragDropProvider } from "@/components/theme/DragDropProvider";
import { categoryApi, productApi, themeApi } from "@/lib/api";
import type { ActiveThemePayload } from "@/lib/types";

type StoreCategory = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  depth: number;
};

type StoreProduct = {
  id: string;
  name: string;
  sku: string;
};

type MenuNodeType = "category" | "product" | "link";

type ThemePromoCardEditor = {
  id: string;
  title: string;
  image?: string;
  href?: string;
};

type MenuNodeEditor = {
  id: string;
  nodeType: MenuNodeType;
  label: string;
  href: string;
  referenceId?: string;
  children: MenuNodeEditor[];
};

type ThemeDynamicMenuItemEditor = {
  id: string;
  nodeType: MenuNodeType;
  label: string;
  href: string;
  referenceId?: string;
  children: MenuNodeEditor[];
  promos: ThemePromoCardEditor[];
};

type MenuNodePayload = {
  nodeType: MenuNodeType;
  type?: MenuNodeType;
  label: string;
  href: string;
  referenceId?: string;
  children: MenuNodePayload[];
};

type ThemePromoCardPayload = {
  title: string;
  image?: string;
  href?: string;
};

type ThemeDynamicMenuItemPayload = MenuNodePayload & {
  promos: ThemePromoCardPayload[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function makeEditorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeNodeType(value: unknown, href: string): MenuNodeType {
  if (value === "category" || value === "product" || value === "link") {
    return value;
  }

  if (/\/products\?category=/i.test(href)) {
    return "category";
  }

  if (/\/products\//i.test(href)) {
    return "product";
  }

  return "link";
}

function normalizeMenuNode(value: unknown): MenuNodeEditor {
  if (!isObject(value)) {
    return {
      id: makeEditorId(),
      nodeType: "link",
      label: "Link",
      href: "/",
      children: [],
    };
  }

  const href = typeof value.href === "string" && value.href.trim() ? value.href : "/";
  const nodeType = normalizeNodeType(value.nodeType ?? value.type, href);

  return {
    id: makeEditorId(),
    nodeType,
    label: typeof value.label === "string" && value.label.trim() ? value.label : "Link",
    href,
    referenceId: typeof value.referenceId === "string"
      ? value.referenceId
      : (typeof value.reference_id === "string" ? value.reference_id : undefined),
    children: Array.isArray(value.children) ? value.children.map((child) => normalizeMenuNode(child)) : [],
  };
}

function normalizePromoCard(value: unknown): ThemePromoCardEditor {
  if (!isObject(value)) {
    return { id: makeEditorId(), title: "Promo" };
  }

  return {
    id: makeEditorId(),
    title: typeof value.title === "string" && value.title.trim() ? value.title : "Promo",
    image: typeof value.image === "string" ? value.image : undefined,
    href: typeof value.href === "string" ? value.href : undefined,
  };
}

function extractMenuItems(payload: ActiveThemePayload | null): ThemeDynamicMenuItemEditor[] {
  if (!payload) return [];

  const sectionsFromStoreCustomConfig = (payload.store_theme.custom_config as { pages?: { header?: { sections?: unknown } } } | undefined)
    ?.pages?.header?.sections;
  const sectionsFromCustomConfig = (payload.custom_config as { pages?: { header?: { sections?: unknown } } } | undefined)
    ?.pages?.header?.sections;
  const sectionsFromMergedConfig = payload.config.pages?.header?.sections;

  const sections = Array.isArray(sectionsFromStoreCustomConfig)
    ? sectionsFromStoreCustomConfig
    : (Array.isArray(sectionsFromCustomConfig)
      ? sectionsFromCustomConfig
      : sectionsFromMergedConfig);

  if (!Array.isArray(sections)) return [];

  const headerSection = sections.find((section) => isObject(section) && section.type === "mega-menu");
  if (!isObject(headerSection) || !isObject(headerSection.settings)) return [];

  const rawItems = headerSection.settings.dynamic_menu_items;
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .filter((entry): entry is Record<string, unknown> => isObject(entry))
    .map((entry) => {
      const normalized = normalizeMenuNode(entry);

      return {
        ...normalized,
        promos: Array.isArray(entry.promos) ? entry.promos.map((promo) => normalizePromoCard(promo)) : [],
      };
    });
}

function serializeMenuNode(node: MenuNodeEditor): MenuNodePayload {
  return {
    nodeType: node.nodeType,
    type: node.nodeType,
    label: node.label.trim() || "Link",
    href: node.href.trim() || "/",
    referenceId: node.referenceId,
    children: node.children.map((child) => serializeMenuNode(child)),
  };
}

function serializeMenuItems(items: ThemeDynamicMenuItemEditor[]): ThemeDynamicMenuItemPayload[] {
  return items.map((item) => ({
    ...serializeMenuNode(item),
    promos: item.promos
      .map((promo) => ({
        title: promo.title.trim() || "Promo",
        image: promo.image?.trim() || undefined,
        href: promo.href?.trim() || undefined,
      }))
      .filter((promo) => promo.title || promo.image || promo.href),
  }));
}

function setDynamicMenuOverride(customConfig: Record<string, unknown>, items: ThemeDynamicMenuItemEditor[]): Record<string, unknown> {
  const next = deepClone(customConfig);
  const pages = isObject(next.pages) ? next.pages : {};
  const header = isObject((pages as Record<string, unknown>).header)
    ? ((pages as Record<string, unknown>).header as Record<string, unknown>)
    : {};
  const sections = Array.isArray(header.sections) ? [...header.sections] : [];

  let megaIndex = sections.findIndex((section) => isObject(section) && section.type === "mega-menu");
  if (megaIndex < 0) {
    sections.push({ type: "mega-menu", settings: {} });
    megaIndex = sections.length - 1;
  }

  const existingSection = isObject(sections[megaIndex]) ? (sections[megaIndex] as Record<string, unknown>) : {};
  const settings = isObject(existingSection.settings)
    ? { ...(existingSection.settings as Record<string, unknown>) }
    : {};

  settings.dynamic_menu_items = serializeMenuItems(items);
  sections[megaIndex] = {
    ...existingSection,
    settings,
  };

  (pages as Record<string, unknown>).header = {
    ...header,
    sections,
  };

  next.pages = pages;
  return next;
}

function buildCategoryHref(category: StoreCategory): string {
  return `/products?category=${encodeURIComponent(category.slug)}`;
}

function buildProductHref(product: StoreProduct): string {
  return `/products/${encodeURIComponent(product.id)}`;
}

function buildCategoryNode(category: StoreCategory, categories: StoreCategory[]): MenuNodeEditor {
  const children = categories
    .filter((candidate) => candidate.parent_id === category.id)
    .map((candidate) => buildCategoryNode(candidate, categories));

  return {
    id: makeEditorId(),
    nodeType: "category",
    label: category.name,
    href: buildCategoryHref(category),
    referenceId: category.id,
    children,
  };
}

function buildProductNode(product: StoreProduct): MenuNodeEditor {
  return {
    id: makeEditorId(),
    nodeType: "product",
    label: product.name,
    href: buildProductHref(product),
    referenceId: product.id,
    children: [],
  };
}

function buildCustomLinkNode(label: string, href: string): MenuNodeEditor {
  return {
    id: makeEditorId(),
    nodeType: "link",
    label: label.trim() || "Custom link",
    href: href.trim() || "/",
    children: [],
  };
}

function nodeTypeLabel(nodeType: MenuNodeType): string {
  if (nodeType === "category") return "Category";
  if (nodeType === "product") return "Product";
  return "Custom link";
}

function addNodeAtPath(nodes: MenuNodeEditor[], path: number[], nextNode: MenuNodeEditor): MenuNodeEditor[] {
  if (path.length === 0) {
    return [...nodes, nextNode];
  }

  const [head, ...tail] = path;

  return nodes.map((node, index) => {
    if (index !== head) return node;

    if (tail.length === 0) {
      return {
        ...node,
        children: [...node.children, nextNode],
      };
    }

    return {
      ...node,
      children: addNodeAtPath(node.children, tail, nextNode),
    };
  });
}

function updateNodeAtPath(
  nodes: MenuNodeEditor[],
  path: number[],
  updater: (node: MenuNodeEditor) => MenuNodeEditor
): MenuNodeEditor[] {
  const [head, ...tail] = path;

  return nodes.map((node, index) => {
    if (index !== head) return node;

    if (tail.length === 0) {
      return updater(node);
    }

    return {
      ...node,
      children: updateNodeAtPath(node.children, tail, updater),
    };
  });
}

function removeNodeAtPath(nodes: MenuNodeEditor[], path: number[]): MenuNodeEditor[] {
  const [head, ...tail] = path;

  if (tail.length === 0) {
    return nodes.filter((_, index) => index !== head);
  }

  return nodes.map((node, index) => {
    if (index !== head) return node;

    return {
      ...node,
      children: removeNodeAtPath(node.children, tail),
    };
  });
}

function NodeComposer({
  categories,
  products,
  defaultMode,
  onAdd,
}: {
  categories: StoreCategory[];
  products: StoreProduct[];
  defaultMode?: MenuNodeType;
  onAdd: (node: MenuNodeEditor) => void;
}) {
  const [mode, setMode] = useState<MenuNodeType>(defaultMode ?? "category");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customHref, setCustomHref] = useState("/");

  const topCategories = useMemo(
    () => categories.filter((category) => !category.parent_id || category.depth === 0),
    [categories]
  );

  function addNode() {
    if (mode === "category") {
      const category = topCategories.find((entry) => entry.id === categoryId);
      if (!category) return;
      onAdd(buildCategoryNode(category, categories));
      return;
    }

    if (mode === "product") {
      const product = products.find((entry) => entry.id === productId);
      if (!product) return;
      onAdd(buildProductNode(product));
      return;
    }

    if (!customLabel.trim()) return;
    onAdd(buildCustomLinkNode(customLabel, customHref));
    setCustomLabel("");
    setCustomHref("/");
  }

  const canAdd =
    (mode === "category" && !!categoryId) ||
    (mode === "product" && !!productId) ||
    (mode === "link" && !!customLabel.trim());

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <div className="grid gap-2 md:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Item type
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as MenuNodeType)}
            className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="category">Category</option>
            <option value="product">Product</option>
            <option value="link">Custom link</option>
          </select>
        </label>

        {mode === "category" && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 md:col-span-2">
            Category
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Select category</option>
              {topCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {mode === "product" && (
          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 md:col-span-2">
            Product
            <select
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </label>
        )}

        {mode === "link" && (
          <>
            <Input
              label="Link title"
              value={customLabel}
              onChange={(event) => setCustomLabel(event.target.value)}
              placeholder="About us"
            />
            <Input
              label="URL"
              value={customHref}
              onChange={(event) => setCustomHref(event.target.value)}
              placeholder="/pages/about or https://example.com"
            />
          </>
        )}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addNode} disabled={!canAdd}>
        <Plus className="h-4 w-4" />
        Add item
      </Button>
    </div>
  );
}

function MenuNodeCard({
  node,
  path,
  categories,
  products,
  onUpdate,
  onRemove,
  onAddChild,
}: {
  node: MenuNodeEditor;
  path: number[];
  categories: StoreCategory[];
  products: StoreProduct[];
  onUpdate: (path: number[], updater: (node: MenuNodeEditor) => MenuNodeEditor) => void;
  onRemove: (path: number[]) => void;
  onAddChild: (path: number[], node: MenuNodeEditor) => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-3">
      <div className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div className="flex items-end">
          <span className="inline-flex h-9 items-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-600">
            {nodeTypeLabel(node.nodeType)}
          </span>
        </div>

        <Input
          label="Label"
          value={node.label}
          onChange={(event) => onUpdate(path, (current) => ({ ...current, label: event.target.value }))}
        />

        <Input
          label="Link"
          value={node.href}
          onChange={(event) => onUpdate(path, (current) => ({ ...current, href: event.target.value }))}
        />

        <div className="flex items-end">
          <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => onRemove(path)}>
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </div>
      </div>

      <NodeComposer
        categories={categories}
        products={products}
        defaultMode="link"
        onAdd={(nextNode) => onAddChild(path, nextNode)}
      />

      {node.children.length > 0 && (
        <div className="space-y-2 border-l-2 border-zinc-200 pl-3">
          {node.children.map((child, index) => (
            <MenuNodeCard
              key={child.id}
              node={child}
              path={[...path, index]}
              categories={categories}
              products={products}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItemRow({
  id,
  index,
  item,
  categories,
  products,
  onChange,
  onRemove,
}: {
  id: string;
  index: number;
  item: ThemeDynamicMenuItemEditor;
  categories: StoreCategory[];
  products: StoreProduct[];
  onChange: (next: ThemeDynamicMenuItemEditor) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  function updateNode(path: number[], updater: (node: MenuNodeEditor) => MenuNodeEditor) {
    onChange({
      ...item,
      children: updateNodeAtPath(item.children, path, updater),
    });
  }

  function removeNode(path: number[]) {
    onChange({
      ...item,
      children: removeNodeAtPath(item.children, path),
    });
  }

  function addChild(path: number[], node: MenuNodeEditor) {
    onChange({
      ...item,
      children: addNodeAtPath(item.children, path, node),
    });
  }

  function updatePromo(indexToUpdate: number, field: keyof ThemePromoCardEditor, value: string) {
    const nextPromos = [...item.promos];
    const target = nextPromos[indexToUpdate];
    if (!target) return;

    nextPromos[indexToUpdate] = {
      ...target,
      [field]: value,
    };

    onChange({
      ...item,
      promos: nextPromos,
    });
  }

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
        <CardHeader className="mb-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
              aria-label="Drag menu item"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div>
              <CardTitle>Menu item #{index + 1}</CardTitle>
              <p className="text-xs text-zinc-500">Navbar parent with custom mega-menu content</p>
            </div>
          </div>

          <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        </CardHeader>

        <div className="grid gap-3 md:grid-cols-3">
          <Input
            label="Navbar label"
            value={item.label}
            onChange={(event) => onChange({ ...item, label: event.target.value })}
          />
          <Input
            label="Navbar link"
            value={item.href}
            onChange={(event) => onChange({ ...item, href: event.target.value })}
          />
          <div className="flex items-end">
            <span className="inline-flex h-9 items-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-600">
              {nodeTypeLabel(item.nodeType)}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-sm font-semibold text-zinc-700">Mega menu hierarchy</p>

          <NodeComposer
            categories={categories}
            products={products}
            defaultMode="category"
            onAdd={(nextNode) => {
              onChange({
                ...item,
                children: [...item.children, nextNode],
              });
            }}
          />

          {item.children.length === 0 ? (
            <p className="text-xs text-zinc-500">No children yet. Add categories, products, or custom links.</p>
          ) : (
            <div className="space-y-2">
              {item.children.map((child, childIndex) => (
                <MenuNodeCard
                  key={child.id}
                  node={child}
                  path={[childIndex]}
                  categories={categories}
                  products={products}
                  onUpdate={updateNode}
                  onRemove={removeNode}
                  onAddChild={addChild}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-zinc-700">Promo/image cards</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onChange({
                  ...item,
                  promos: [
                    ...item.promos,
                    {
                      id: makeEditorId(),
                      title: "",
                      href: "/",
                      image: "",
                    },
                  ],
                });
              }}
            >
              <Plus className="h-4 w-4" />
              Add image card
            </Button>
          </div>

          {item.promos.length === 0 ? (
            <p className="text-xs text-zinc-500">No promo cards yet.</p>
          ) : (
            <div className="space-y-2">
              {item.promos.map((promo, promoIndex) => (
                <div key={promo.id} className="rounded-lg border border-zinc-200 bg-white p-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input
                      label="Title"
                      value={promo.title}
                      onChange={(event) => updatePromo(promoIndex, "title", event.target.value)}
                      placeholder="Get started with a kit"
                    />
                    <Input
                      label="Link"
                      value={promo.href ?? ""}
                      onChange={(event) => updatePromo(promoIndex, "href", event.target.value)}
                      placeholder="/products?category=kits"
                    />
                    <Input
                      label="Image URL"
                      value={promo.image ?? ""}
                      onChange={(event) => updatePromo(promoIndex, "image", event.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                      onClick={() => {
                        const nextPromos = [...item.promos];
                        nextPromos.splice(promoIndex, 1);
                        onChange({
                          ...item,
                          promos: nextPromos,
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

interface ThemeMenuBuilderProps {
  slug: string;
}

export function ThemeMenuBuilder({ slug }: ThemeMenuBuilderProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [activeTheme, setActiveTheme] = useState<ActiveThemePayload | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [items, setItems] = useState<ThemeDynamicMenuItemEditor[]>([]);
  const [itemIds, setItemIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [themeResponse, categoryResponse, productResponse] = await Promise.all([
        themeApi.getStoreTheme(slug),
        categoryApi.list(slug),
        productApi.list(slug),
      ]);

      setActiveTheme(themeResponse.data);
      setCategories(Array.isArray(categoryResponse.categories) ? categoryResponse.categories : []);
      setProducts(
        Array.isArray(productResponse.data)
          ? productResponse.data.map((entry) => ({ id: entry.id, name: entry.name, sku: entry.sku }))
          : []
      );

      const extracted = extractMenuItems(themeResponse.data);
      setItems(extracted);
      setItemIds(extracted.map(() => makeEditorId()));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load theme menu builder.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  async function searchProducts() {
    try {
      setSearchingProducts(true);
      const response = await productApi.list(slug, { q: productQuery.trim() || undefined });
      setProducts(
        Array.isArray(response.data)
          ? response.data.map((entry) => ({ id: entry.id, name: entry.name, sku: entry.sku }))
          : []
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to search products.";
      setError(message);
    } finally {
      setSearchingProducts(false);
    }
  }

  function reorderItems(activeId: string, overId: string) {
    if (activeId === overId) return;

    const from = itemIds.indexOf(activeId);
    const to = itemIds.indexOf(overId);
    if (from < 0 || to < 0) return;

    const nextItems = [...items];
    const [movedItem] = nextItems.splice(from, 1);
    nextItems.splice(to, 0, movedItem);

    const nextIds = [...itemIds];
    const [movedId] = nextIds.splice(from, 1);
    nextIds.splice(to, 0, movedId);

    setItems(nextItems);
    setItemIds(nextIds);
  }

  async function saveMenu() {
    if (!activeTheme) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const nextCustomConfig = setDynamicMenuOverride(
        (activeTheme.store_theme.custom_config ?? {}) as Record<string, unknown>,
        items
      );

      const response = await themeApi.updateConfig(slug, nextCustomConfig);
      setActiveTheme(response.data);

      const extracted = extractMenuItems(response.data);
      setItems(extracted);
      setItemIds(extracted.map(() => makeEditorId()));
      setSuccess(response.message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save theme menu.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card>
        <CardHeader className="mb-4">
          <div>
            <CardTitle>Theme menu builder</CardTitle>
            <p className="mt-1 text-sm text-zinc-500">
              Build a custom navbar + mega menu with categories, products, custom links, and image cards.
            </p>
          </div>

          <Button type="button" variant="secondary" onClick={() => void saveMenu()} loading={saving}>
            {saving ? "Saving" : "Save menu"}
          </Button>
        </CardHeader>

        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              label="Product picker search"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="Search product by name or SKU"
            />
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={() => void searchProducts()} loading={searchingProducts}>
                Search products
              </Button>
            </div>
          </div>

          <NodeComposer
            categories={categories}
            products={products}
            defaultMode="category"
            onAdd={(nextNode) => {
              if (items.some((entry) => entry.href === nextNode.href && nextNode.nodeType !== "link")) {
                setError("This item is already in your top navigation.");
                return;
              }

              setError("");
              setItems((prev) => [
                ...prev,
                {
                  id: makeEditorId(),
                  nodeType: nextNode.nodeType,
                  label: nextNode.label,
                  href: nextNode.href,
                  referenceId: nextNode.referenceId,
                  children: nextNode.children,
                  promos: [],
                },
              ]);
              setItemIds((prev) => [...prev, makeEditorId()]);
            }}
          />
        </div>
      </Card>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500">
            No manual menu items yet. Add categories, products, or links and save to power the storefront mega menu.
          </p>
        </Card>
      ) : (
        <DragDropProvider itemIds={itemIds} onReorder={reorderItems}>
          <div className="space-y-3">
            {items.map((item, index) => {
              const id = itemIds[index] ?? `${item.label}-${index}`;

              return (
                <MenuItemRow
                  key={id}
                  id={id}
                  index={index}
                  item={item}
                  categories={categories}
                  products={products}
                  onChange={(next) => {
                    setItems((prev) => {
                      const nextItems = [...prev];
                      if (!nextItems[index]) {
                        return prev;
                      }

                      nextItems[index] = next;
                      return nextItems;
                    });
                  }}
                  onRemove={() => {
                    setItems((prev) => {
                      const nextItems = [...prev];
                      nextItems.splice(index, 1);
                      return nextItems;
                    });

                    setItemIds((prev) => {
                      const nextIds = [...prev];
                      nextIds.splice(index, 1);
                      return nextIds;
                    });
                  }}
                />
              );
            })}
          </div>
        </DragDropProvider>
      )}
    </div>
  );
}
