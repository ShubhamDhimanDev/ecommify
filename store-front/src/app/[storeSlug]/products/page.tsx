"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { productApi, categoryApi } from "@/lib/api/client";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product, Category } from "@/lib/types/product";
import { SlidersHorizontal, X } from "lucide-react";

export default function StoreProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "popular">("newest");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") || null
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (storeSlug) {
      loadData();
    }
  }, [storeSlug, selectedCategory, sortBy]);

  async function loadData() {
    setLoading(true);
    try {
      // Load categories
      const categoriesData = await categoryApi.list(storeSlug);
      setCategories(categoriesData);

      // Load products
      const filters: Record<string, unknown> = {};
      if (selectedCategory) filters.category_id = selectedCategory;

      const productsData = await productApi.list(storeSlug, filters);
      let productsList = productsData as Product[];

      // Sort products
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
  }

  // Filter section component
  const FilterSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="label-caps mb-4 text-secondary">Categories</h3>
        <div className="space-y-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`block w-full text-left px-3 py-2 rounded-lg transition ${
              !selectedCategory
                ? "bg-primary text-on-primary font-medium"
                : "text-secondary hover:text-foreground"
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setMobileFiltersOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                selectedCategory === cat.id
                  ? "bg-primary text-on-primary font-medium"
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
            <label key={range} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="rounded border border-outline-variant" />
              <span className="text-sm text-secondary">{range}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant/30 pt-6">
        <h3 className="label-caps mb-4 text-secondary">Availability</h3>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" className="rounded border border-outline-variant" defaultChecked />
          <span className="text-sm text-secondary">In Stock</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <div className="border-b border-outline-variant/30 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="headline-md text-foreground mb-2">All Products</h1>
          <p className="text-secondary">Browse our complete collection of carefully curated items.</p>
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
            <FilterSection />
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
              <FilterSection />
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
                onChange={(e) => setSortBy(e.target.value as any)}
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
