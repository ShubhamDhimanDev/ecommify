import { CategoryNav } from "@/components/sections/CategoryNav";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Ecommify Storefront</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Phase 1 placeholder homepage with featured products and category navigation.
        </p>
      </section>
      <CategoryNav />
      <FeaturedProducts />
    </div>
  );
}
