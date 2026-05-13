"use client";

import { useStore } from "@/context/StoreContext";
import { HeroSection } from "@/components/sections/Hero";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { CategoryNav } from "@/components/sections/CategoryNav";

export default function StoreHomePage() {
  const { store } = useStore();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <HeroSection />

      {/* Categories */}
      <div className="mx-auto w-full max-w-7xl px-4">
        <CategoryNav />
      </div>

      {/* Featured Products */}
      <div className="mx-auto w-full max-w-7xl px-4">
        <FeaturedProducts />
      </div>

      {/* Testimonials Section (Placeholder) */}
      <div className="mx-auto w-full max-w-7xl px-4">
        <section className="py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Customer Reviews</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { name: "Sarah M.", review: "Amazing products and fast shipping! Will definitely order again.", rating: 5 },
              { name: "John D.", review: "Great quality and excellent customer service. Highly recommended!", rating: 5 },
              { name: "Emma L.", review: "Love the selection and prices. Perfect experience!", rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-yellow-400">★</span>
                  ))}
                </div>
                <p className="text-gray-600 italic mb-4">"{testimonial.review}"</p>
                <p className="font-semibold text-gray-900">— {testimonial.name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
