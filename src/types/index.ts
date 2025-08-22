export interface AuthUser {
  id: string; // from auth.users
  email?: string;
  name?: string; // from staff table - now optional
  role?: 'Owner' | 'Manager' | 'Cashier'; // from staff table - now optional
  staff_id?: string; // from staff table - now optional
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Cashier';
  created_at: string;
  status: 'Active' | 'Inactive';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  buying_price: number;
  price: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  product_id: string;
  product_name: string;
  cashier_id: string;
  cashier_name: string;
  staff_id: string;
  customer_name?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  date: string;
  time: string;
  created_at: string;
  // Joined data
  cashier?: { name: string };
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
