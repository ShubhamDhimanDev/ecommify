"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { themeApi } from "@/lib/api/client";
import { Mail, Phone, MapPin } from "lucide-react";

type ThemeFooterSettings = {
  supportEmail?: string;
  supportPhone?: string;
  address?: string;
};

function extractFooterSettings(payload: unknown): ThemeFooterSettings | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = (payload as { data?: unknown }).data ?? payload;
  if (!root || typeof root !== "object") {
    return null;
  }

  const config = (root as { config?: { pages?: Record<string, { sections?: Array<{ type?: string; settings?: Record<string, unknown> }> }> } }).config;
  const sections = config?.pages?.footer?.sections;

  if (!Array.isArray(sections)) {
    return null;
  }

  const footerColumns = sections.find((section) => section?.type === "footer-columns");
  const settings = footerColumns?.settings;

  if (!settings || typeof settings !== "object") {
    return null;
  }

  return {
    supportEmail: typeof settings.support_email === "string" ? settings.support_email : undefined,
    supportPhone: typeof settings.support_phone === "string" ? settings.support_phone : undefined,
    address: typeof settings.address === "string" ? settings.address : undefined,
  };
}

interface FooterProps {
  storeSlug: string;
}

export function Footer({ storeSlug }: FooterProps) {
  const { store } = useStore();
  const searchParams = useSearchParams();
  const previewTheme = searchParams.get("preview_theme");
  const previewPage = searchParams.get("preview_page");
  const [themeFooter, setThemeFooter] = useState<ThemeFooterSettings | null>(null);

  useEffect(() => {
    if (!storeSlug) {
      return;
    }

    void themeApi
      .getByStoreSlug(storeSlug, {
        theme: previewTheme,
        page: previewPage,
      })
      .then((payload) => {
        setThemeFooter(extractFooterSettings(payload));
      })
      .catch(() => null);
  }, [previewPage, previewTheme, storeSlug]);

  return (
    <footer className="mt-20 border-t border-outline-variant/50 bg-surface text-secondary">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="air-card grid gap-10 rounded-[28px] p-8 md:grid-cols-4 md:p-10">
          {/* Brand */}
          <div>
            <h3 className="display-title mb-4 text-2xl text-foreground">{store?.name || "Store"}</h3>
            <p className="text-sm leading-relaxed">{store?.description || "Premium curated goods for the discerning customer."}</p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">Shop</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href={`/${storeSlug}/products`} className="font-semibold hover:text-foreground transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="font-semibold hover:text-foreground transition">
                  Featured
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="font-semibold hover:text-foreground transition">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href={`/${storeSlug}`} className="font-semibold hover:text-foreground transition">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="font-semibold hover:text-foreground transition">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="font-semibold hover:text-foreground transition">
                  FAQs
                </a>
              </li>
              <li>
                <a href="#" className="font-semibold hover:text-foreground transition">
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a href="#" className="font-semibold hover:text-foreground transition">
                  Size Guide
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">Get in Touch</h4>
            <div className="space-y-3">
              <a href={`mailto:${themeFooter?.supportEmail || "support@store.com"}`} className="flex items-center gap-3 text-sm font-semibold hover:text-foreground transition">
                <Mail className="h-4 w-4 flex-shrink-0" />
                {themeFooter?.supportEmail || "support@store.com"}
              </a>
              <a href={`tel:${(themeFooter?.supportPhone || "+1 (555) 123-4567").replace(/[^\d+]/g, "")}`} className="flex items-center gap-3 text-sm font-semibold hover:text-foreground transition">
                <Phone className="h-4 w-4 flex-shrink-0" />
                {themeFooter?.supportPhone || "+1 (555) 123-4567"}
              </a>
              <div className="flex items-start gap-3 text-sm font-semibold">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{themeFooter?.address || "123 Premium St, New York, NY 10001"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="mt-10 border-t border-outline-variant/50 pt-7 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} {store?.name || "Store"}. All rights reserved. <span className="mx-2">|</span><span className="text-foreground">Powered by Ecommify</span></p>
        </div>
      </div>
    </footer>
  );
}
