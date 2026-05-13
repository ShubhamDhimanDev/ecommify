export type Order = {
  id: string;
  status: "pending" | "confirmed" | "paid" | "shipped" | "delivered" | "cancelled";
  total_amount: number;
  subtotal?: number;
  tax_amount?: number;
  currency?: string;
  notes?: string;
  items?: OrderItem[];
  created_at?: string;
  updated_at?: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product_snapshot?: Record<string, unknown>;
};
