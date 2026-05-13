"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { MoveRight, ShieldCheck, Truck, Undo2 } from "lucide-react";

export function HeroSection() {
  const { store } = useStore();

  // Create a premium gradient background as fallback
  const backgroundStyle = {
    background: store?.logo_url 
      ? `linear-gradient(135deg, rgba(28, 27, 27, 0.4) 0%, rgba(88, 95, 108, 0.2) 100%), url(${store.logo_url})`
      : "linear-gradient(135deg, rgba(28, 27, 27, 0.8) 0%, rgba(88, 95, 108, 0.4) 100%), linear-gradient(to bottom, #e5e2e1 0%, #fdf8f8 100%)",
    backgroundSize: store?.logo_url ? "cover" : "auto",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };

  return (
    <section className="relative overflow-hidden bg-surface-container" style={backgroundStyle}>
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/10 via-foreground/5 to-transparent" />
      
      <div className="relative px-4 py-20 sm:py-32 md:py-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="label-caps mb-4 text-secondary">Premium Shopping Experience</p>
            <h1 className="display-lg-mobile md:display-lg mb-6 text-foreground">
              {store?.name || "Welcome to Our Store"}
            </h1>
            <p className="body-lg mb-8 text-secondary max-w-xl">
              {store?.description || "Discover an extraordinary collection of curated products. Experience premium quality, exceptional service, and unbeatable prices."}
            </p>
            <Link
              href={`/${store?.slug || 'store'}/products`}
              className="inline-flex items-center gap-3 bg-primary px-8 py-4 text-on-primary font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Shop Collection <MoveRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="relative border-t border-outline-variant/40 bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Truck, title: "Fast Shipping", desc: "Reliable delivery with real-time tracking" },
              { icon: ShieldCheck, title: "Secure Checkout", desc: "Protected payments and encrypted transactions" },
              { icon: Undo2, title: "Easy Returns", desc: "Hassle-free returns within 30 days" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-secondary">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
