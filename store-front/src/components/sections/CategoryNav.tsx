"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { categoryApi } from "@/lib/api/client";
import type { Category } from "@/lib/types/product";

export function CategoryNav() {
  const params = useParams();
  const storeSlug = params?.storeSlug as string | undefined;
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      if (!storeSlug) {
        return;
      }

      try {
        const list = await categoryApi.list(storeSlug);
        setCategories(list.slice(0, 6));
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    }

    loadCategories();
  }, [storeSlug]);

  return (
    <section className="py-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="label-caps text-secondary">Shop by Category</h2>
        {storeSlug && (
          <Link href={`/${storeSlug}/products`} className="text-sm font-medium text-foreground hover:text-secondary transition">
            View All
          </Link>
        )}
      </div>

      {!storeSlug ? (
        <p className="text-sm text-secondary">Open a tenant store route to load categories.</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-secondary">No categories published yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${storeSlug}/products?category=${category.id}`}
              className="group rounded-lg border border-outline-variant/50 bg-surface px-4 py-3 text-center text-sm font-medium text-secondary hover:border-outline hover:bg-surface-container transition"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
