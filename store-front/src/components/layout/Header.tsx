"use client";

import { useCallback, useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { categoryApi, themeApi } from "@/lib/api/client";
import type { Category } from "@/lib/types/product";
import { Menu, Search, ShoppingBag, UserRound, X, Globe, ArrowRight } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ThemeMenuLink = {
  label: string;
  href: string;
};

type ThemeMegaGroup = {
  title: string;
  links: ThemeMenuLink[];
};

type ThemePromoCard = {
  title: string;
  image?: string;
  href?: string;
};

type ThemeMenuNode = {
  label: string;
  href: string;
  children: ThemeMenuNode[];
};

type ThemeDynamicMenuItem = {
  label: string;
  href: string;
  children: ThemeMenuNode[];
  promos: ThemePromoCard[];
};

type ThemeHeaderSettings = {
  announcementText?: string;
  menuItems?: ThemeMenuLink[];
  megaGroups?: ThemeMegaGroup[];
  dynamicMenuItems?: ThemeDynamicMenuItem[];
};

function normalizeMenuLinks(value: unknown): ThemeMenuLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is { label?: unknown; href?: unknown } => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      label: typeof entry.label === "string" && entry.label.trim() ? entry.label : "Link",
      href: typeof entry.href === "string" ? entry.href : "",
    }));
}

function normalizeMenuNodes(value: unknown): ThemeMenuNode[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is { label?: unknown; href?: unknown; children?: unknown } => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      label: typeof entry.label === "string" && entry.label.trim() ? entry.label : "Link",
      href: typeof entry.href === "string" ? entry.href : "",
      children: normalizeMenuNodes(entry.children),
    }));
}

function normalizeMegaGroups(value: unknown): ThemeMegaGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is { title?: unknown; links?: unknown } => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      title: typeof entry.title === "string" && entry.title.trim() ? entry.title : "Menu",
      links: normalizeMenuLinks(entry.links),
    }))
    .filter((group) => group.links.length > 0);
}

function normalizePromoCards(value: unknown): ThemePromoCard[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is { title?: unknown; image?: unknown; image_url?: unknown; href?: unknown } => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      title: typeof entry.title === "string" && entry.title.trim() ? entry.title : "Featured",
      image:
        typeof entry.image === "string"
          ? entry.image
          : (typeof entry.image_url === "string" ? entry.image_url : undefined),
      href: typeof entry.href === "string" ? entry.href : undefined,
    }));
}

function resolvePromoImageSrc(image: string): string {
  if (!image) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(image) || image.startsWith("data:") || image.startsWith("blob:")) {
    return image;
  }

  if (image.startsWith("/")) {
    return `${API_BASE}${image}`;
  }

  return `${API_BASE}/${image}`;
}

function normalizeDynamicMenuItems(value: unknown): ThemeDynamicMenuItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is { label?: unknown; href?: unknown; children?: unknown; promos?: unknown } => Boolean(entry) && typeof entry === "object")
    .map((entry) => ({
      label: typeof entry.label === "string" && entry.label.trim() ? entry.label : "Menu",
      href: typeof entry.href === "string" ? entry.href : "",
      children: normalizeMenuNodes(entry.children),
      promos: normalizePromoCards(entry.promos),
    }));
}

function resolveThemedPath(storeSlug: string, href: string): string {
  if (!href || href === "/") {
    return `/${storeSlug}`;
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  if (href.startsWith(`/${storeSlug}`)) {
    return href;
  }

  return `/${storeSlug}${href.startsWith("/") ? href : `/${href}`}`;
}

function extractHeaderSettings(payload: unknown): ThemeHeaderSettings | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = (payload as { data?: unknown }).data ?? payload;
  if (!root || typeof root !== "object") {
    return null;
  }

  const config = (root as { config?: { pages?: Record<string, { sections?: Array<{ type?: string; settings?: Record<string, unknown> }> }> } }).config;
  const headerSections = config?.pages?.header?.sections;

  if (!Array.isArray(headerSections)) {
    return null;
  }

  const megaMenu = headerSections.find((section) => section?.type === "mega-menu");
  const settings = megaMenu?.settings;

  if (!settings || typeof settings !== "object") {
    return null;
  }

  return {
    announcementText:
      typeof settings.announcement_text === "string" ? settings.announcement_text : undefined,
    menuItems: normalizeMenuLinks(settings.menu_items),
    megaGroups: normalizeMegaGroups(settings.mega_groups),
    dynamicMenuItems: normalizeDynamicMenuItems(settings.dynamic_menu_items),
  };
}

interface HeaderProps {
  storeSlug: string;
}

export function Header({ storeSlug }: HeaderProps) {
  const { store } = useStore();
  const { isAuthenticated, logout, customer } = useAuth();
  const { items } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [themeHeader, setThemeHeader] = useState<ThemeHeaderSettings | null>(null);
  const [activeDesktopMega, setActiveDesktopMega] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const previewTheme = searchParams.get("preview_theme");
  const previewPage = searchParams.get("preview_page");

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/${storeSlug}/products?search=${encodeURIComponent(q)}`);
    setMobileSearchOpen(false);
  }

  function openMobileSearch() {
    setMobileSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  const loadCategories = useCallback(async () => {
    try {
      const [data, storeTheme] = await Promise.all([
        categoryApi.list(storeSlug),
        themeApi.getByStoreSlug(storeSlug, {
          theme: previewTheme,
          page: previewPage,
        }).catch(() => null),
      ]);

      setCategories(Array.isArray(data) ? data : []);

      if (storeTheme) {
        setThemeHeader(extractHeaderSettings(storeTheme));
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }, [previewPage, previewTheme, storeSlug]);

  useEffect(() => {
    if (storeSlug) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadCategories();
    }
  }, [storeSlug, loadCategories]);

  const topLevelCategories = useMemo(
    () => categories.filter((category) => !category.parent_id || category.depth === 0),
    [categories]
  );

  const fallbackDynamicMenu = useMemo<ThemeDynamicMenuItem[]>(() => {
    const buildCategoryNodes = (parentId: string, depth: number): ThemeMenuNode[] => {
      const limit = depth === 0 ? 12 : 8;

      return categories
        .filter((candidate) => candidate.parent_id === parentId)
        .slice(0, limit)
        .map((child) => ({
          label: child.name,
          href: `/${storeSlug}/products?category=${encodeURIComponent(child.slug)}`,
          children: depth < 2 ? buildCategoryNodes(child.id, depth + 1) : [],
        }));
    };

    return topLevelCategories.slice(0, 9).map((category) => {
      const children = buildCategoryNodes(category.id, 0);

      return {
        label: category.name,
        href: `/${storeSlug}/products?category=${encodeURIComponent(category.slug)}`,
        children,
        promos: [],
      };
    });
  }, [categories, storeSlug, topLevelCategories]);

  const desktopDynamicMenu = themeHeader?.dynamicMenuItems?.length
    ? themeHeader.dynamicMenuItems
    : fallbackDynamicMenu;

  const desktopLinks = desktopDynamicMenu.length > 0
    ? desktopDynamicMenu.map((item) => ({ label: item.label, href: item.href }))
    : (themeHeader?.menuItems?.length
      ? themeHeader.menuItems
      : [
          { label: "Home", href: `/${storeSlug}` },
          { label: "Shop All", href: `/${storeSlug}/products` },
        ]);

  const activeMenuItem = desktopDynamicMenu.find((item) => item.label === activeDesktopMega) ?? null;
  const activeMenuHasMega = Boolean(activeMenuItem && (activeMenuItem.children.length > 0 || activeMenuItem.promos.length > 0));
  const activeMenuHasChildren = Boolean(activeMenuItem && activeMenuItem.children.length > 0);

  function renderGroupedChildren(nodes: ThemeMenuNode[]): ReactNode {
    if (nodes.length === 0) {
      return null;
    }

    return (
      <div className="mt-3 space-y-3">
        {nodes.map((node, index) => (
          <div key={`${node.label}-${node.href}-${index}`} className="space-y-1.5">
            <Link
              href={resolveThemedPath(storeSlug, node.href)}
              className="text-sm font-semibold text-foreground/90 transition hover:text-foreground hover:underline hover:underline-offset-4"
              onClick={() => setActiveDesktopMega(null)}
            >
              {node.label}
            </Link>

            {node.children.length > 0 && (
              <div className="flex flex-col gap-1 pl-1">
                {node.children.map((leaf, leafIndex) => (
                  <Link
                    key={`${leaf.label}-${leaf.href}-${leafIndex}`}
                    href={resolveThemedPath(storeSlug, leaf.href)}
                    className="text-[13px] font-medium text-secondary transition hover:text-foreground hover:underline hover:underline-offset-4"
                    onClick={() => setActiveDesktopMega(null)}
                  >
                    {leaf.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-surface/95 backdrop-blur-xl">
      <nav className="px-4 py-4 sm:py-5">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="air-card rounded-full p-2.5 transition hover:scale-95"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <button
                onClick={openMobileSearch}
                className="air-card rounded-full p-2.5 transition hover:scale-95"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>

            <Link href={`/${storeSlug}`} className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
              <div className="flex items-center gap-2 text-center md:text-left">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">E</span>
                <h1 className="display-title text-xl text-foreground md:text-2xl">{store?.name || "Ecommify"}</h1>
              </div>
            </Link>

            <div className="hidden flex-1 px-5 md:block">
              <form onSubmit={handleSearch} className="mx-auto flex max-w-xl">
                <div
                  className="air-card flex h-12 w-full items-center rounded-full px-4 transition hover:shadow-[rgba(0,0,0,0.08)_0px_4px_12px]"
                  style={{ border: 'none', borderRadius: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: 'var(--surface)' }}
                >
                  <Search className="h-4 w-4 shrink-0 text-secondary" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="header-search-input ml-3 flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-secondary/70 outline-none"
                    style={{ border: 'none', outline: 'none', background: 'transparent', WebkitAppearance: 'none' }}
                  />
                  {searchQuery && (
                    <button
                      type="submit"
                      className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition hover:bg-primary/90"
                      aria-label="Submit search"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              <button className="hidden rounded-full p-2 text-secondary transition hover:bg-surface-container md:inline-flex" aria-label="Language">
                <Globe className="h-5 w-5" />
              </button>

              <Link
                href={isAuthenticated ? `/${storeSlug}/account` : `/${storeSlug}/login`}
                className="air-card inline-flex rounded-full p-2.5"
                aria-label="Account"
              >
                {isAuthenticated && customer ? (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                    {customer.first_name?.[0]?.toUpperCase() ?? <UserRound className="h-3 w-3" />}
                  </span>
                ) : (
                  <UserRound className="h-5 w-5 text-foreground" />
                )}
              </Link>

              <Link
                href={`/${storeSlug}/cart`}
                className="air-card relative inline-flex rounded-full p-2.5"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5 text-foreground" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary shadow">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Mobile search bar (expands below header row) */}
          {mobileSearchOpen && (
            <form onSubmit={handleSearch} className="mt-3 flex items-center gap-2 md:hidden">
              <div
                className="air-card flex flex-1 items-center rounded-full px-4 py-2.5"
                style={{ border: 'none', borderRadius: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', background: 'var(--surface)' }}
              >
                <Search className="h-4 w-4 shrink-0 text-secondary" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="header-search-input ml-3 flex-1 bg-transparent text-sm font-medium text-foreground placeholder:text-secondary/70 outline-none"
                  style={{ border: 'none', outline: 'none', background: 'transparent', WebkitAppearance: 'none' }}
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
                aria-label="Submit search"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant text-secondary"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          )}

          <div
            className="relative mt-4 hidden md:block"
            onMouseLeave={() => setActiveDesktopMega(null)}
          >
            <div className="flex items-center gap-8 overflow-x-auto pb-1">
              {desktopLinks.map((item, index) => {
                const dynamicItem = desktopDynamicMenu.find((candidate) => candidate.label === item.label);
                const menuHasMega = Boolean(dynamicItem && (dynamicItem.children.length > 0 || dynamicItem.promos.length > 0));
                const isActive = activeDesktopMega === item.label;

                if (menuHasMega) {
                  return (
                    <button
                      key={`${item.label}-${index}`}
                      type="button"
                      onMouseEnter={() => setActiveDesktopMega(item.label)}
                      onFocus={() => setActiveDesktopMega(item.label)}
                      className={`whitespace-nowrap pb-2 text-[17px] font-semibold transition ${
                        isActive
                          ? "text-primary"
                          : "text-foreground hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                }

                return (
                  <Link
                    key={`${item.label}-${index}`}
                    href={resolveThemedPath(storeSlug, item.href)}
                    className="whitespace-nowrap pb-2 text-[17px] font-semibold text-foreground transition hover:text-primary"
                    onMouseEnter={() => setActiveDesktopMega(null)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {activeMenuHasMega && activeMenuItem && (
              <div className="absolute left-1/2 top-full z-50 w-screen -translate-x-1/2">
                <div className="bg-surface/95 px-6 py-6 backdrop-blur-xl">
                  <div
                    className={`mx-auto grid max-w-7xl gap-8 ${
                      activeMenuItem.promos.length > 0 && activeMenuHasChildren
                        ? "lg:grid-cols-[1.8fr_1fr]"
                        : "lg:grid-cols-1"
                    }`}
                  >
                  {activeMenuHasChildren && (
                    <div>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        {activeMenuItem.children.map((node, index) => (
                          <div key={`${activeMenuItem.label}-${node.label}-${index}`} className="min-w-0">
                            <Link
                              href={resolveThemedPath(storeSlug, node.href)}
                              className="text-[18px] font-semibold text-foreground transition hover:underline hover:underline-offset-4"
                              onClick={() => setActiveDesktopMega(null)}
                            >
                              {node.label}
                            </Link>
                            {renderGroupedChildren(node.children)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeMenuItem.promos.length > 0 && (
                    <div className={`grid gap-3 sm:grid-cols-2 ${activeMenuHasChildren ? "lg:grid-cols-1" : "lg:grid-cols-3"}`}>
                      {activeMenuItem.promos.map((promo, index) => {
                        const href = promo.href ? resolveThemedPath(storeSlug, promo.href) : `/${storeSlug}`;

                        return (
                          <Link
                            key={`${promo.title}-${index}`}
                            href={href}
                            className="group overflow-hidden rounded-2xl bg-surface-container"
                            onClick={() => setActiveDesktopMega(null)}
                          >
                            {promo.image ? (
                              <img
                                src={resolvePromoImageSrc(promo.image)}
                                alt={promo.title}
                                className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            ) : null}
                            <p className="px-4 py-3 text-sm font-semibold text-foreground">{promo.title}</p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
                </div>
              </div>
            )}
          </div>

          {mobileMenuOpen && (
            <div className="air-card mt-5 flex flex-col gap-3 rounded-3xl p-5 md:hidden">
              {desktopLinks.map((item, index) => (
                <Link
                  key={`${item.label}-${index}`}
                  href={resolveThemedPath(storeSlug, item.href)}
                  className="air-pill"
                >
                  {item.label}
                </Link>
              ))}

              {activeMenuItem?.children.map((item, index) => (
                <Link
                  key={`${item.label}-${index}`}
                  href={resolveThemedPath(storeSlug, item.href)}
                  className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-secondary"
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="rounded-xl border border-red-200 px-4 py-2 text-left text-sm font-semibold text-error"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    href={`/${storeSlug}/login`}
                    className="air-pill"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/${storeSlug}/register`}
                    className="air-pill air-pill-active"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
