"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Store,
  Boxes,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  Tags,
  Settings,
  Plus,
  Shield,
  User,
  LogOut,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

const bottomNav = [
  { href: "/dashboard/profile",  label: "Profile",  icon: User },
  { href: "/dashboard/security", label: "Security", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams<{ slug?: string }>();
  const { user, logout } = useAuth();
  const { stores, activeStore } = useStore();

  // Prefer slug from URL params, fall back to activeStore slug
  const slug = params.slug ?? activeStore?.slug ?? "";
  const base = slug ? `/${slug}` : "/dashboard";

  const storeNav = [
    { href: `${base}/categories`, label: "Categories", icon: Boxes },
    { href: `${base}/products`,   label: "Products",   icon: Package },
    { href: `${base}/orders`,     label: "Orders",     icon: ShoppingCart },
    { href: `${base}/customers`,  label: "Customers",  icon: Users },
    { href: `${base}/payments`,   label: "Payments",   icon: CreditCard },
    { href: `${base}/tags`,       label: "Tags",       icon: Tags },
    { href: `${base}/settings`,   label: "Settings",   icon: Settings },
  ];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-zinc-950 border-r border-zinc-800">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-5 border-b border-zinc-800">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600">
          <Store className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">Ecommify</span>
        <span className="ml-auto rounded text-[10px] px-1.5 py-0.5 font-medium bg-zinc-800 text-zinc-400">
          Merchant
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <NavItem
          href={slug ? `/${slug}` : "/dashboard"}
          label="Overview"
          Icon={LayoutDashboard}
          active={slug ? pathname === `/${slug}` : pathname === "/dashboard"}
        />
        <NavItem
          href="/dashboard/store"
          label="My Store"
          Icon={Store}
          active={pathname.startsWith("/dashboard/store")}
        />

        {stores.length > 1 && (
          <NavItem
            href="/dashboard/store/select"
            label="Switch Store"
            Icon={Repeat}
            active={pathname.startsWith("/dashboard/store/select")}
          />
        )}

        <NavItem
          href="/dashboard/store/new"
          label="Add New Store"
          Icon={Plus}
          active={pathname.startsWith("/dashboard/store/new")}
        />

        <div className="my-3 border-t border-zinc-800" />

        {storeNav.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname.startsWith(href)} />
        ))}

        <div className="my-3 border-t border-zinc-800" />

        {bottomNav.map(({ href, label, icon: Icon }) => (
          <NavItem key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-zinc-800/60 transition-colors">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
            {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-zinc-100">{user?.name}</p>
            <p className="truncate text-[10px] text-zinc-500">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: React.ElementType;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary-600 text-white"
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
