"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { productApi, categoryApi, themeApi } from "@/lib/api/client";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product, Category } from "@/lib/types/product";
import { SlidersHorizontal, X } from "lucide-react";

type ProductListThemeSettings = {
  title?: string;
  subtitle?: string;
};

type SortBy = "newest" | "price-low" | "price-high" | "popular";

interface FiltersPanelProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onCloseMobileFilters?: () => void;
}

function FiltersPanel({ categories, selectedCategory, onSelectCategory, onCloseMobileFilters }: FiltersPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="label-caps mb-4 text-secondary">Categories</h3>
        <div className="space-y-3">
          <button
            onClick={() => onSelectCategory(null)}
            className={`block w-full rounded-lg px-3 py-2 text-left transition ${
              !selectedCategory
                ? "bg-primary font-medium text-on-primary"
                : "text-secondary hover:text-foreground"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                onCloseMobileFilters?.();
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left transition ${
                selectedCategory === cat.id
                  ? "bg-primary font-medium text-on-primary"
                  : "text-secondary hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="label-caps mb-4 text-secondary">Price Range</h3>
        <div className="space-y-3">
          {["Under $50", "$50 - $100", "$100 - $200", "Over $200"].map((range) => (
            <label key={range} className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="rounded border border-outline-variant" />
              <span className="text-sm text-secondary">{range}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="label-caps mb-4 text-secondary">Availability</h3>
        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="rounded border border-outline-variant" defaultChecked />
          <span className="text-sm text-secondary">In Stock</span>
        </label>
      </div>
    </div>
  );
}

function parseSortBy(value: string): SortBy {
  return value === "price-low" || value === "price-high" || value === "popular" ? value : "newest";
}

function extractProductListSettings(payload: unknown): ProductListThemeSettings | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = (payload as { data?: unknown }).data ?? payload;
  if (!root || typeof root !== "object") {
    return null;
  }

  const config = (root as { config?: { pages?: Record<string, { sections?: Array<{ type?: string; settings?: Record<string, unknown> }> }> } }).config;
  const sections = config?.pages?.["product-list"]?.sections;

  if (!Array.isArray(sections)) {
    return null;
  }

  const heroSection = sections.find((section) => section?.type === "page-hero");
  const settings = heroSection?.settings;

  if (!settings || typeof settings !== "object") {
    return null;
  }

  return {
    title: typeof settings.title === "string" ? settings.title : undefined,
    subtitle: typeof settings.subtitle === "string" ? settings.subtitle : undefined,
  };
}

export default function StoreProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;
  const previewTheme = searchParams.get("preview_theme");
  const previewPage = searchParams.get("preview_page");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") || null
  );
  const [searchQuery] = useState<string>(searchParams.get("search") || "");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [themePage, setThemePage] = useState<ProductListThemeSettings | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesData, themePayload] = await Promise.all([
        categoryApi.list(storeSlug),
        themeApi.getByStoreSlug(storeSlug, {
          theme: previewTheme,
          page: previewPage,
        }).catch(() => null),
      ]);
      setCategories(categoriesData);

      if (themePayload) {
        setThemePage(extractProductListSettings(themePayload));
      }

      const filters: Record<string, unknown> = {};
      if (selectedCategory) filters.category_id = selectedCategory;
      if (searchQuery) filters.search = searchQuery;

      const productsData = await productApi.list(storeSlug, filters);
      let productsList = productsData as Product[];

      switch (sortBy) {
        case "price-low":
          productsList = [...productsList].sort((a, b) => parseFloat(String(a.price)) - parseFloat(String(b.price)));
          break;
        case "price-high":
          productsList = [...productsList].sort((a, b) => parseFloat(String(b.price)) - parseFloat(String(a.price)));
          break;
        case "popular":
          productsList = [...productsList].reverse();
          break;
      }

      setProducts(productsList);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }, [previewPage, previewTheme, searchQuery, selectedCategory, sortBy, storeSlug]);

  useEffect(() => {
    if (storeSlug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadData();
    }
  }, [storeSlug, loadData]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <div className="border-b border-outline-variant/30 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="headline-md text-foreground mb-2">
            {searchQuery ? `Results for "${searchQuery}"` : (themePage?.title || "All Products")}
          </h1>
          <p className="text-secondary">
            {searchQuery
              ? `Showing products matching your search.`
              : (themePage?.subtitle || "Browse our complete collection of carefully curated items.")}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 flex-1">
        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <p className="text-sm text-secondary">{products.length} products</p>
          <button
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-outline-variant hover:bg-surface-container transition"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {/* Mobile Filters */}
        {mobileFiltersOpen && (
          <div className="md:hidden mb-8 p-6 rounded-lg border border-outline-variant bg-surface">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-foreground">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 hover:bg-surface-container rounded transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FiltersPanel
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onCloseMobileFilters={() => setMobileFiltersOpen(false)}
            />
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-4">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <div className="sticky top-24 space-y-6 p-6 border border-outline-variant/30 rounded-lg bg-surface-container">
              <div>
                <h2 className="inline-flex items-center gap-2 font-semibold text-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </h2>
              </div>
              <FiltersPanel
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </div>

          {/* Products */}
          <div className="md:col-span-3">
            {/* Sort Options */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-outline-variant/30">
              <p className="text-sm text-secondary">
                {loading ? "Loading..." : `${products.length} product${products.length !== 1 ? "s" : ""}`}
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(parseSortBy(e.target.value))}
                className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-sm text-foreground hover:border-outline transition"
              >
                <option value="newest">Sort: Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-secondary">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-secondary mb-4">No products found in this category.</p>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm font-medium text-primary hover:text-secondary transition"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ProductGrid products={products} storeSlug={storeSlug} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
