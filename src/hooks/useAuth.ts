import { useState, useEffect } from 'react';
import { User, AuthState } from '../types';

const DEMO_USERS = [
  { id: '1', name: 'Ahmed Mohammed', email: 'ahmed@madehhardware.com', role: 'Owner' as const, createdAt: '2024-01-01' },
  { id: '2', name: 'Fatima Hassan', email: 'fatima@madehhardware.com', role: 'Manager' as const, createdAt: '2024-01-15' },
  { id: '3', name: 'Omar Said', email: 'omar@madehhardware.com', role: 'Cashier' as const, createdAt: '2024-02-01' },
];

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('madeh_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setAuthState({ user, isAuthenticated: true });
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    // Demo login - in real app, this would make API call
    const user = DEMO_USERS.find(u => u.email === email);
    if (user && password === 'password123') {
      localStorage.setItem('madeh_user', JSON.stringify(user));
      setAuthState({ user, isAuthenticated: true });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('madeh_user');
    setAuthState({ user: null, isAuthenticated: false });
  };

  const hasPermission = (requiredRoles: string[]): boolean => {
    if (!authState.user) return false;
    return requiredRoles.includes(authState.user.role);
  };

  return {
    ...authState,
    login,
    logout,
    hasPermission,
  };
};
