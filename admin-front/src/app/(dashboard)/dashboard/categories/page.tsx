"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { categoryApi, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { formatDate } from "@/lib/utils";

export default function CategoriesPage() {
  const { activeStore, isLoading: storeLoading } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", parent_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const parentOptions = [
    { value: "", label: "No parent" },
    ...categories.map((c) => ({ value: c.id, label: `${"- ".repeat(c.depth)}${c.name}` })),
  ];

  const loadCategories = useCallback(async (q?: string) => {
    if (!activeStore?.slug) return;
    setLoading(true);
    setError("");
    try {
      const res = await categoryApi.list(activeStore.slug, q);
      setCategories(res.categories);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    if (!activeStore?.slug) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCategories();
  }, [activeStore?.slug, loadCategories]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", slug: "", parent_id: "" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore?.slug) return;

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        parent_id: form.parent_id || null,
      };

      if (editingId) {
        await categoryApi.update(activeStore.slug, editingId, payload);
      } else {
        await categoryApi.create(activeStore.slug, payload);
      }

      resetForm();
      await loadCategories(search || undefined);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id ?? "",
    });
  };

  const remove = async (id: string) => {
    if (!activeStore?.slug) return;
    setError("");
    try {
      await categoryApi.remove(activeStore.slug, id);
      await loadCategories(search || undefined);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to delete category.");
    }
  };

  if (storeLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!activeStore) {
    return <Alert variant="warning">Select a store to manage categories.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Categories</h2>
        <p className="mt-1 text-sm text-zinc-500">Manage product categories for {activeStore.name}.</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit category" : "Create category"}</CardTitle>
        </CardHeader>
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            required
          />
          <Select
            label="Parent"
            value={form.parent_id}
            onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value }))}
            options={parentOptions.filter((o) => o.value !== editingId)}
          />
          <div className="md:col-span-3 flex items-center gap-2">
            <Button type="submit" loading={submitting}>{editingId ? "Update" : "Create"}</Button>
            {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category list</CardTitle>
          <div className="w-72">
            <Input
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void loadCategories(search || undefined);
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
              <Th>Slug</Th>
              <Th>Depth</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </TableHead>
            <TableBody>
              {categories.length === 0 ? (
                <TableEmpty message="No categories found." />
              ) : (
                categories.map((category) => (
                  <Tr key={category.id}>
                    <Td>{"- ".repeat(category.depth)}{category.name}</Td>
                    <Td>{category.slug}</Td>
                    <Td>{category.depth}</Td>
                    <Td>{formatDate(category.created_at)}</Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => startEdit(category)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => remove(category.id)}>Delete</Button>
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
