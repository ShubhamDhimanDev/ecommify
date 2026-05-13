"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { productApi } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

interface TagCount {
  name: string;
  count: number;
}

export function TagsManager() {
  const { activeStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<TagCount[]>([]);

  useEffect(() => {
    async function loadTags() {
      if (!activeStore) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const products = await productApi.list(activeStore.slug);
        const counts = new Map<string, number>();

        for (const p of products.data ?? []) {
          for (const tag of p.tags ?? []) {
            const key = tag.tag_name.trim();
            if (!key) continue;
            counts.set(key, (counts.get(key) ?? 0) + 1);
          }
        }

        const list = Array.from(counts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

        setTags(list);
      } catch {
        setError("Could not load tags from product catalog.");
      } finally {
        setLoading(false);
      }
    }

    void loadTags();
  }, [activeStore]);

  const filtered = useMemo(() => {
    if (!query.trim()) return tags;
    const q = query.toLowerCase();
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, query]);

  if (!activeStore) {
    return <Alert variant="warning">Select a store to view tags.</Alert>;
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Product tags</CardTitle>
        </CardHeader>
        <Input
          label="Search tags"
          placeholder="Search by tag name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Card>

      <Card>
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-zinc-500">No tags found.</p>
          ) : (
            filtered.map((tag) => (
              <div key={tag.name} className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2">
                <span className="text-sm font-medium text-zinc-900">{tag.name}</span>
                <span className="text-xs text-zinc-500">Used in {tag.count} product{tag.count === 1 ? "" : "s"}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
