"use client";

import { HeroSection } from "@/components/sections/Hero";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { CategoryNav } from "@/components/sections/CategoryNav";
import { ShieldCheck, Sparkles, Truck, Users } from "lucide-react";

export default function StoreHomePage() {
  return (
    <div className="space-y-12 pb-14">
      <HeroSection />

      <div className="mx-auto w-full max-w-7xl px-4">
        <CategoryNav />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4">
        <FeaturedProducts />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4">
        <section className="py-12">
          <h2 className="display-title mb-12 text-center text-4xl text-foreground">Why shoppers trust us</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Sparkles, title: "Curated products", description: "Quality-first inventory from verified merchants." },
              { icon: Truck, title: "Reliable shipping", description: "Fast handling and transparent delivery updates." },
              { icon: ShieldCheck, title: "Safe checkout", description: "Protected payment flow and secure customer accounts." },
            ].map((feature, i) => (
              <div key={i} className="section-shell p-6">
                <div className="mb-3 inline-flex rounded-full border border-outline-variant bg-surface-low p-3">
                  <feature.icon className="h-5 w-5 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4">
        <div className="section-shell px-6 py-10 md:px-10">
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Community</p>
              <h2 className="display-title mt-2 text-3xl text-foreground">Thousands of customers shopping daily</h2>
              <p className="mt-2 text-sm text-secondary">Built for multi-tenant catalogs and growing brands.</p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-xl border border-outline-variant bg-surface px-5 py-4">
              <Users className="h-6 w-6 text-secondary" />
              <div>
                <p className="text-2xl font-bold text-foreground">10k+</p>
                <p className="text-xs uppercase tracking-wide text-secondary">happy shoppers</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
