"use client";

import { useStore } from "@/context/StoreContext";

export function HeroSection() {
  const { store } = useStore();

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 py-20 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to {store?.name}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-lg">
              {store?.description || "Discover amazing products curated just for you. Shop our latest collection with premium quality and unbeatable prices."}
            </p>
            <button className="inline-flex items-center rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-blue-50 transition">
              Shop Now →
            </button>
          </div>
          <div className="hidden lg:flex flex-1 justify-end">
            <div className="relative w-64 h-64 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <div className="text-6xl">🛍️</div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { icon: "🚚", title: "Free Shipping", desc: "On orders over $50" },
            { icon: "🔒", title: "Secure Checkout", desc: "100% secure transactions" },
            { icon: "↩️", title: "Easy Returns", desc: "30-day money back guarantee" },
          ].map((feature, i) => (
            <div key={i} className="rounded-lg bg-white/10 backdrop-blur-sm p-6 text-white">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-blue-100 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
