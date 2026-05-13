export interface LocalOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
}

export interface LocalShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface LocalOrder {
  id: string;
  store_slug: string;
  status: "pending" | "confirmed" | "paid" | "shipped" | "delivered";
  created_at: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items: LocalOrderItem[];
  shipping_address: LocalShippingAddress;
}

function getStorageKey(storeSlug: string) {
  return `orders_${storeSlug}`;
}

export function getOrders(storeSlug: string): LocalOrder[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(getStorageKey(storeSlug));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as LocalOrder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrder(storeSlug: string, order: LocalOrder): void {
  if (typeof window === "undefined") return;
  const current = getOrders(storeSlug);
  const next = [order, ...current];
  localStorage.setItem(getStorageKey(storeSlug), JSON.stringify(next));
}

export function getOrderById(storeSlug: string, orderId: string): LocalOrder | null {
  return getOrders(storeSlug).find((order) => order.id === orderId) ?? null;
}
