import { CategoryNav } from "@/components/sections/CategoryNav";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-800 py-20 px-4 rounded-2xl">
        <div className="mx-auto max-w-4xl text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Welcome to Ecommify</h1>
          <p className="text-xl text-blue-100 mb-8">
            Discover amazing products from our curated sellers. Shop the best deals on quality items delivered to your door.
          </p>
          <a
            href="#products"
            className="inline-flex items-center rounded-lg bg-white px-8 py-3 font-semibold text-blue-600 hover:bg-blue-50 transition"
          >
            Start Shopping →
          </a>
        </div>
      </section>

      {/* Category Navigation */}
      <CategoryNav />

      {/* Featured Products */}
      <section id="products">
        <FeaturedProducts />
      </section>

      {/* Why Choose Us */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Shop With Us</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: "✨", title: "Quality Products", desc: "Hand-picked selection of premium items" },
              { icon: "🚚", title: "Fast Shipping", desc: "Get your orders delivered quickly" },
              { icon: "🛡️", title: "Safe & Secure", desc: "Protected payments and buyer guarantee" },
              { icon: "⭐", title: "Great Support", desc: "24/7 customer service available" },
            ].map((feature, i) => (
              <div key={i} className="text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 text-sm mt-2">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-100 py-12 rounded-2xl">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Subscribe to Our Newsletter</h2>
          <p className="text-gray-600 mb-6">Get exclusive deals and new product alerts delivered to your inbox.</p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
