"use client";

import { HeroSection } from "@/components/sections/Hero";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { CategoryNav } from "@/components/sections/CategoryNav";
import { ShieldCheck, Sparkles, Truck, Users } from "lucide-react";

export default function StoreHomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="flex flex-col gap-20">
        {/* Category Navigation */}
        <section className="px-4">
          <div className="mx-auto max-w-7xl">
            <CategoryNav />
          </div>
        </section>

        {/* Featured Products */}
        <section className="px-4">
          <div className="mx-auto max-w-7xl">
            <FeaturedProducts />
          </div>
        </section>

        {/* Why Trust Us Section */}
        <section className="px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <h2 className="headline-md text-foreground mb-12 text-center">Why Customers Choose Us</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: "Curated Selection",
                  description: "Carefully selected products from trusted vendors.",
                },
                {
                  icon: Truck,
                  title: "Fast & Reliable",
                  description: "Quick processing and dependable shipping to your door.",
                },
                {
                  icon: ShieldCheck,
                  title: "Secure & Safe",
                  description: "Protected transactions with 100% buyer protection.",
                },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="mb-4 rounded-lg bg-primary/10 p-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-secondary">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Community Stats */}
        <section className="border-t border-outline-variant/30 px-4 py-12">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-lg border border-outline-variant/30 bg-surface-container px-8 py-12 text-center">
              <p className="label-caps text-secondary mb-4">Join Our Community</p>
              <h2 className="headline-md text-foreground mb-8">
                Thousands of Customers Shopping Daily
              </h2>
              <div className="inline-flex items-center gap-8 md:gap-16">
                <div>
                  <p className="display-lg-mobile text-foreground">10k+</p>
                  <p className="text-sm text-secondary">Happy Shoppers</p>
                </div>
                <div className="h-12 w-px bg-outline-variant/30" />
                <div>
                  <p className="display-lg-mobile text-foreground">50k+</p>
                  <p className="text-sm text-secondary">Products Available</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
