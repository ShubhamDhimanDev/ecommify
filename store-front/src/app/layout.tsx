import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/context/StoreContext";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Ecommify Storefront",
  description: "Public storefront for Ecommify SaaS platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-white text-gray-900">
        <AuthProvider>
          <CartProvider>
            <StoreProvider>
              <div className="flex flex-col min-h-screen">
                <main className="flex-1">{children}</main>
              </div>
            </StoreProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
