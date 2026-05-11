import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-zinc-900">
          Ecommify Store
        </Link>
        <nav className="flex items-center gap-4 text-sm text-zinc-600">
          <span>Search</span>
          <span>Cart</span>
        </nav>
      </div>
    </header>
  );
}
