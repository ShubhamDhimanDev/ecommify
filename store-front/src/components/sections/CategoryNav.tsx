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
        setCategories(list.slice(0, 8));
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    }

    loadCategories();
  }, [storeSlug]);

  return (
    <section className="section-shell p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">Categories</h2>
        {storeSlug && (
          <Link href={`/${storeSlug}/products`} className="text-sm font-medium text-foreground underline-offset-2 hover:underline">
            View all
          </Link>
        )}
      </div>

      {!storeSlug ? (
        <p className="text-sm text-secondary">Open a tenant store route to load categories.</p>
      ) : categories.length === 0 ? (
        <p className="text-sm text-secondary">No categories published yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${storeSlug}/products?category=${category.id}`}
              className="rounded-full border border-outline-variant bg-surface px-4 py-2 text-sm text-secondary hover:border-outline hover:text-foreground"
            >
              {category.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
