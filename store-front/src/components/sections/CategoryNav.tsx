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
    <section className="py-2">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="label-caps text-secondary">Shop by Category</h2>
        {storeSlug && (
          <Link href={`/${storeSlug}/products`} className="text-sm font-bold text-foreground hover:text-primary transition">
            View All
          </Link>
        )}
      </div>

      {!storeSlug ? (
        <p className="text-sm text-secondary">Open a tenant store route to load categories.</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-secondary">No categories published yet.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          <Link href={`/${storeSlug}/products`} className="air-pill air-pill-active whitespace-nowrap">
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${storeSlug}/products?category=${encodeURIComponent(category.slug)}`}
              className="air-pill whitespace-nowrap"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
