"use client";

import { useStore } from "@/context/StoreContext";
import { MoveRight, ShieldCheck, Truck, Undo2 } from "lucide-react";

export function HeroSection() {
  const { store } = useStore();

  return (
    <section className="relative overflow-hidden border-b border-outline-variant/40 bg-surface-container py-20 px-4 md:py-24">
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-accent/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-8 h-72 w-72 rounded-full bg-surface-variant/70 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-10">
          <div className="flex-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">A Modern Storefront Theme</p>
            <h1 className="display-title mb-4 text-5xl text-foreground md:text-6xl">
              Welcome to {store?.name}
            </h1>
            <p className="mb-8 max-w-xl text-lg text-secondary">
              {store?.description || "Discover amazing products curated just for you. Shop our latest collection with premium quality and unbeatable prices."}
            </p>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-on-primary hover:translate-x-1">
              Shop Now <MoveRight className="h-4 w-4" />
            </button>
          </div>
          <div className="hidden flex-1 justify-end lg:flex">
            <div className="relative h-72 w-72 overflow-hidden rounded-3xl border border-outline-variant/60 bg-surface shadow-[0_20px_45px_rgba(25,25,25,0.08)]">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-5xl font-semibold text-foreground">{store?.name?.slice(0, 2).toUpperCase() || "ST"}</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { icon: Truck, title: "Fast Shipping", desc: "Reliable delivery windows and tracking" },
            { icon: ShieldCheck, title: "Secure Checkout", desc: "Protected payment and account sessions" },
            { icon: Undo2, title: "Easy Returns", desc: "Straightforward return workflows" },
          ].map((feature, i) => (
            <div key={i} className="section-shell p-6">
              <feature.icon className="mb-3 h-6 w-6 text-secondary" />
              <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-secondary">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
