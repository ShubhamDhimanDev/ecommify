"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

const titles: Record<string, string> = {
  "/dashboard":         "Overview",
  "/dashboard/store":   "My Store",
  "/dashboard/store/select": "Select Store",
  "/dashboard/profile": "Profile",
  "/dashboard/security":"Security",
};

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeStore, stores } = useStore();

  const title = Object.entries(titles)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([key]) => pathname.startsWith(key))?.[1] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <h1 className="text-sm font-semibold text-zinc-900">{title}</h1>
      <div className="flex items-center gap-3">
        {activeStore && (
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 ring-1 ring-primary-200">
            {activeStore.name}
          </span>
        )}
        {!activeStore && stores.length > 1 && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200">
            No store selected
          </span>
        )}
        <button className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        {!user?.email_verified_at && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
            Email unverified
          </span>
        )}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-[11px] font-semibold text-white">
          {user?.name?.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
