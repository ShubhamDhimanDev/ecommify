import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/context/StoreContext";
import { CartProvider } from "@/context/CartContext";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

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
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-full bg-background text-foreground`}>
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
