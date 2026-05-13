"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { Mail, Phone, MapPin } from "lucide-react";

interface FooterProps {
  storeSlug: string;
}

export function Footer({ storeSlug }: FooterProps) {
  const { store } = useStore();

  return (
    <footer className="border-t border-outline-variant/30 bg-surface text-secondary">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="display-title text-lg text-foreground mb-4">{store?.name || "Store"}</h3>
            <p className="text-sm leading-relaxed">{store?.description || "Premium curated goods for the discerning customer."}</p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${storeSlug}/products`} className="hover:text-foreground transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="hover:text-foreground transition">
                  Featured
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="hover:text-foreground transition">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="hover:text-foreground transition">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground transition">
                  Size Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Get in Touch</h4>
            <div className="space-y-3">
              <a href="mailto:support@store.com" className="flex items-center gap-3 text-sm hover:text-foreground transition">
                <Mail className="h-4 w-4 flex-shrink-0" />
                support@store.com
              </a>
              <a href="tel:+15551234567" className="flex items-center gap-3 text-sm hover:text-foreground transition">
                <Phone className="h-4 w-4 flex-shrink-0" />
                +1 (555) 123-4567
              </a>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>123 Premium St<br />New York, NY 10001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-12 pt-8 border-t border-outline-variant/30 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} {store?.name || "Store"}. All rights reserved. | <span className="text-foreground">Powered by Ecommify</span></p>
        </div>
      </div>
    </footer>
  );
}
