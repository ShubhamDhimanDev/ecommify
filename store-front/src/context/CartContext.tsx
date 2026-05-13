"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { cartApi } from "@/lib/api/client";
import type { Product } from "@/lib/types/product";

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  addItem: (product: Product, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  getTotal: () => number;
  getSubtotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("cart_items");
    const savedCartId = localStorage.getItem("cart_id");
    
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse saved cart:", e);
      }
    }
    
    if (savedCartId) {
      setCartId(savedCartId);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart_items", JSON.stringify(items));
  }, [items]);

  const addItem = async (product: Product, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if item already exists
      const existingItem = items.find((item) => item.product.id === product.id);

      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        setItems(
          items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product,
          quantity,
          unitPrice: parseFloat(String(product.price ?? 0)),
        };
        setItems([...items, newItem]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      setItems(items.filter((item) => item.product.id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);

    try {
      if (quantity <= 0) {
        await removeItem(productId);
      } else {
        setItems(
          items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update quantity");
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = () => {
    setItems([]);
    setCartId(null);
    localStorage.removeItem("cart_items");
    localStorage.removeItem("cart_id");
  };

  const getSubtotal = () => {
    return items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  };

  const getTotal = () => {
    const subtotal = getSubtotal();
    const tax = subtotal * 0.1; // 10% tax
    const shipping = subtotal > 50 ? 0 : 9.99;
    return subtotal + tax + shipping;
  };

  const value: CartContextType = {
    items,
    isLoading,
    error,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotal,
    getSubtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
