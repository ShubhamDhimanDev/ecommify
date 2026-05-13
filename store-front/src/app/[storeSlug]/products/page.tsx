"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { productApi, categoryApi } from "@/lib/api/client";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product, Category } from "@/lib/types/product";
import { SlidersHorizontal } from "lucide-react";

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

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="display-title mb-2 text-4xl text-foreground">Shop All Products</h1>
        <p className="text-secondary">Browse our complete collection of quality items</p>
      </div>

      <div className="grid gap-8 md:grid-cols-4">
        <div className="section-shell h-fit p-6">
          <h2 className="mb-4 inline-flex items-center gap-2 font-bold text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </h2>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-foreground">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                  !selectedCategory
                    ? "bg-surface-container text-foreground font-medium"
                    : "text-secondary hover:bg-surface-low"
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                    selectedCategory === cat.id
                      ? "bg-surface-container text-foreground font-medium"
                      : "text-secondary hover:bg-surface-low"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-3 font-semibold text-foreground">Price Range</h3>
            <div className="space-y-2">
              {["Under $50", "$50 - $100", "$100 - $200", "Over $200"].map((range) => (
                <label key={range} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-outline" />
                  <span className="text-sm text-secondary">{range}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-foreground">Availability</h3>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-outline" defaultChecked />
              <span className="text-sm text-secondary">In Stock Only</span>
            </label>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-secondary">Showing {products.length} products</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-outline-variant bg-surface px-4 py-2 text-foreground"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {loading ? (
            <div className="section-shell flex items-center justify-center py-12">
              <p className="text-secondary">Loading products...</p>
            </div>
          ) : (
            <ProductGrid products={products} storeSlug={storeSlug} />
          )}
        </div>
      </div>
    </div>
  );
}
