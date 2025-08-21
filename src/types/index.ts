export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Manager' | 'Cashier';
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  date: string;
  time: string;
}

export interface DailySummary {
  date: string;
  totalSales: number;
  totalRevenue: number;
  topSellingProduct: string;
  lowStockAlerts: number;
}

export type UserRole = 'Owner' | 'Manager' | 'Cashier';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
