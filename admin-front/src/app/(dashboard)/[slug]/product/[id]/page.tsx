"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { ApiError, productApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import { formatAmount, formatDate, calculateDiscountedPrice, getDiscountDisplay } from "@/lib/utils";

export default function ProductViewPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const { activeStore, isLoading: storeLoading } = useStore();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProduct = () => {
    setLoading(true);
    setError("");
    return productApi
      .detail(slug, id)
      .then((res) => setProduct(res.product))
      .catch((err: unknown) => {
        const e = err as ApiError;
        setError(e.message ?? "Failed to load product.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!slug || !id) return;

    void loadProduct();
  }, [slug, id]);

  if (storeLoading || loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  if (!activeStore) {
    return <Alert variant="warning">Select a store to view product.</Alert>;
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!product) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(`/${slug}/products`)}
          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          &larr; Back to Products
        </button>
        <Button onClick={() => router.push(`/${slug}/product/${id}/edit`)}>
          Edit Product
        </Button>
        <Button variant="secondary" onClick={() => router.push(`/${slug}/products/new?parent_product_id=${id}`)}>
          Create Variant
        </Button>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-zinc-900">{product.name}</h2>
        <p className="mt-1 text-sm text-zinc-500">SKU: {product.sku}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-zinc-500">Name</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{product.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">SKU</dt>
                <dd className="mt-0.5 text-sm font-mono text-zinc-900">{product.sku}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500">Price</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{formatAmount(product.price)}</dd>
              </div>
              {product.discount_type && (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Discount</dt>
                  <dd className="mt-0.5 space-y-0.5">
                    <div className="text-sm text-zinc-900">
                      {getDiscountDisplay(product.price, product.discount_type, product.discount_value)} {product.discount_type === "percentage" ? "off" : ""}
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Sale price: {calculateDiscountedPrice(product.price, product.discount_type, product.discount_value)}
                    </div>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-zinc-500">Stock</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{product.stock}</dd>
              </div>
              {product.category && (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Category</dt>
                  <dd className="mt-0.5 text-sm text-zinc-900">{product.category.name}</dd>
                </div>
              )}
              {product.parentProduct && (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">Parent product</dt>
                  <dd className="mt-0.5 text-sm text-zinc-900">{product.parentProduct.name} ({product.parentProduct.sku})</dd>
                </div>
              )}
              {product.hs_code && (
                <div>
                  <dt className="text-xs font-medium text-zinc-500">HS Code</dt>
                  <dd className="mt-0.5 text-sm font-mono text-zinc-900">{product.hs_code}</dd>
                </div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">Description</dt>
                <dd className="mt-0.5 text-sm text-zinc-900 whitespace-pre-wrap">
                  {product.description ?? <span className="text-zinc-400 italic">No description</span>}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">Meta title</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">
                  {product.meta_title ?? <span className="text-zinc-400 italic">No meta title</span>}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">Meta description</dt>
                <dd className="mt-0.5 text-sm text-zinc-900 whitespace-pre-wrap">
                  {product.meta_description ?? <span className="text-zinc-400 italic">No meta description</span>}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium text-zinc-500">Meta keywords</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">
                  {product.meta_keywords && product.meta_keywords.length > 0 ? product.meta_keywords.join(", ") : <span className="text-zinc-400 italic">No meta keywords</span>}
                </dd>
              </div>
              {product.tags && product.tags.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-zinc-500">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {product.tags.map((tag) => (
                      <span key={tag.id} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700">
                        {tag.tag_name}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-zinc-500">Created</dt>
                <dd className="mt-0.5 text-sm text-zinc-900">{formatDate(product.created_at)}</dd>
              </div>
            </dl>
          </Card>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Variants ({product.variants.length})</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {product.variants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{variant.name}</p>
                      <p className="text-xs text-zinc-500 font-mono">{variant.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-zinc-900">
                        {variant.price ? formatAmount(variant.price) : "—"}
                      </p>
                      <p className="text-xs text-zinc-500">Stock: {variant.stock}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Media */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Media ({product.images?.length ?? 0})</CardTitle>
            </CardHeader>
            {!product.images || product.images.length === 0 ? (
              <p className="text-sm text-zinc-400 italic">No media uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {product.images.map((img) => (
                  <div key={img.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                    {img.media_type === "video" ? (
                      <video src={img.image_url} className="h-28 w-full object-cover" controls muted />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img.image_url} alt={img.alt_text ?? "product image"} className="h-28 w-full object-cover" />
                    )}
                    {img.alt_text && (
                      <p className="px-2 py-1 text-xs text-zinc-500 truncate">{img.alt_text}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
