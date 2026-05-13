"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { productApi, categoryApi } from "@/lib/api/client";
import { ProductGrid } from "@/components/product/ProductGrid";
import type { Product, Category } from "@/lib/types/product";

export default function StoreProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const storeSlug = params?.storeSlug as string;
  const { store } = useStore();

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
      setCategories((categoriesData as any).categories || []);

      // Load products
      const filters: Record<string, unknown> = {};
      if (selectedCategory) filters.category_id = selectedCategory;

      const productsData = await productApi.list(storeSlug, filters);
      let productsList = ((productsData as any).data || []) as Product[];

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Shop All Products</h1>
        <p className="text-gray-600">Browse our complete collection of quality items</p>
      </div>

      <div className="grid gap-8 md:grid-cols-4">
        {/* Sidebar Filters */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 h-fit">
          <h2 className="font-bold text-gray-900 mb-4">Filters</h2>

          {/* Categories */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`block w-full text-left px-3 py-2 rounded-lg transition ${
                  !selectedCategory
                    ? "bg-blue-100 text-blue-600 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
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
                      ? "bg-blue-100 text-blue-600 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
            <div className="space-y-2">
              {["Under $50", "$50 - $100", "$100 - $200", "Over $200"].map((range) => (
                <label key={range} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700">{range}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Status */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded border-gray-300" defaultChecked />
              <span className="text-sm text-gray-700">In Stock Only</span>
            </label>
          </div>
        </div>

        {/* Products */}
        <div className="md:col-span-3">
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-600">Showing {products.length} products</p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : (
            <ProductGrid products={products} storeSlug={storeSlug} />
          )}
        </div>
      </div>
    </div>
  );
}
