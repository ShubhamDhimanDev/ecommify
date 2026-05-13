"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";

interface FooterProps {
  storeSlug: string;
}

export function Footer({ storeSlug }: FooterProps) {
  const { store } = useStore();

  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Store Info */}
          <div>
            <h3 className="font-bold text-white">{store?.name || "Store"}</h3>
            <p className="mt-2 text-sm">{store?.description}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={`/${storeSlug}/products`} className="hover:text-white transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="hover:text-white transition">
                  Featured
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="hover:text-white transition">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white">Support</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Shipping Info
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white">Contact</h4>
            <p className="mt-4 text-sm">Email: support@store.com</p>
            <p className="text-sm">Phone: +1 (555) 123-4567</p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {store?.name}. All rights reserved. Powered by Ecommify.</p>
        </div>
      </div>
    </footer>
  );
}
