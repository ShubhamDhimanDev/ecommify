export type Product = {
  id: string;
  name: string;
  price: number | string;
  description?: string;
  sku?: string;
  stock?: number;
  images?: ProductImage[];
  category_id?: string;
  category_name?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  sort_order?: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  path?: string;
  depth?: number;
};
