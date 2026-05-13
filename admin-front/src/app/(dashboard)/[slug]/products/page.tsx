"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { ApiError, productApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { Table, TableHead, Th, TableBody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { formatAmount, formatDate, calculateDiscountedPrice, getDiscountDisplay } from "@/lib/utils";
import Link from "next/link";

export default function ProductsPage() {
  const { slug } = useParams<{ slug: string }>();
  const { activeStore, isLoading: storeLoading } = useStore();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadProducts = useCallback(async (q?: string) => {
    if (!slug) return;
    setLoading(true);
    setError("");
    try {
      const res = await productApi.list(slug, q ? { q } : undefined);
      setProducts(res.data);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProducts();
  }, [slug, loadProducts]);

  const remove = async (id: string) => {
    if (!slug) return;
    setError("");
    try {
      await productApi.remove(slug, id);
      await loadProducts(search || undefined);
    } catch (err: unknown) {
      const e = err as ApiError;
      setError(e.message ?? "Failed to delete product.");
    }
  };

  if (storeLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!activeStore) {
    return <Alert variant="warning">Select a store to manage products.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Products</h2>
          <p className="mt-1 text-sm text-zinc-500">Manage products for {activeStore.name}.</p>
        </div>
        <Link href={`/${slug}/products/new`}>
          <Button>
            <Plus size={16} />
            Add New Product
          </Button>
        </Link>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Product list</CardTitle>
          <div className="w-72">
            <Input
              placeholder="Search by name or SKU"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void loadProducts(search || undefined);
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
              <Th>SKU</Th>
              <Th>Parent Product</Th>
              <Th>Price</Th>
              <Th>Discount</Th>
              <Th>Stock</Th>
              <Th>Variants</Th>
              <Th>Media</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <TableEmpty message="No products found." />
              ) : (
                products.map((product) => (
                  <Tr key={product.id}>
                    <Td>{product.name}</Td>
                    <Td>{product.sku}</Td>
                    <Td>{product.parentProduct ? `${product.parentProduct.name} (${product.parentProduct.sku})` : "—"}</Td>
                    <Td>{formatAmount(product.price)}</Td>
                    <Td>
                      {product.discount_type ? (
                        <div className="text-sm">
                          <div>{calculateDiscountedPrice(product.price, product.discount_type, product.discount_value)}</div>
                          <div className="text-xs text-zinc-500">{getDiscountDisplay(product.price, product.discount_type, product.discount_value)} off</div>
                        </div>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>{product.stock}</Td>
                    <Td>{product.variants?.length ?? 0}</Td>
                    <Td>{product.images?.length ?? 0}</Td>
                    <Td>{formatDate(product.created_at)}</Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => router.push(`/${slug}/product/${product.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => router.push(`/${slug}/product/${product.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => remove(product.id)}>
                          Delete
                        </Button>
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
