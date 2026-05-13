export type Customer = {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  notes?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type CustomerSession = Customer & {
  token?: string;
};
