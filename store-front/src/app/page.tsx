import { CategoryNav } from "@/components/sections/CategoryNav";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-12 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-2xl border border-outline-variant/50 bg-surface-container py-20 px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="display-title mb-4 text-5xl text-foreground">Welcome to Ecommify</h1>
          <p className="mb-8 text-xl text-secondary">
            Discover products from multi-tenant sellers using a dynamic, API-driven storefront theme.
          </p>
          <a
            href="#products"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-on-primary hover:opacity-90"
          >
            Start Shopping <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <CategoryNav />

      <section id="products">
        <FeaturedProducts />
      </section>
    </div>
  );
}
