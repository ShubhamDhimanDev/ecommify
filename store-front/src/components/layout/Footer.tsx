"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Headphones, Mail, Phone } from "lucide-react";

interface FooterProps {
  storeSlug: string;
}

export function Footer({ storeSlug }: FooterProps) {
  const { store } = useStore();

  return (
    <footer className="border-t border-outline-variant bg-surface-container-high text-secondary">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <h3 className="display-title text-xl text-foreground">{store?.name || "Store"}</h3>
            <p className="mt-2 text-sm">{store?.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href={`/${storeSlug}/products`} className="hover:text-foreground">
                  All Products
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="hover:text-foreground">
                  Featured
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="hover:text-foreground">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Support</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href="#" className="inline-flex items-center gap-2 hover:text-foreground">
                  <Headphones className="h-4 w-4" />
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Shipping Info
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground">Contact</h4>
            <p className="mt-4 inline-flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4" />
              support@store.com
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              +1 (555) 123-4567
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-outline-variant pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {store?.name}. All rights reserved. Powered by Ecommify.</p>
        </div>
      </div>
    </footer>
  );
}
