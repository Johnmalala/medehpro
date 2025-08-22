import { useState, useEffect } from 'react';
import { User, AuthState } from '../types';

const DEMO_USERS = [
  { id: '1', name: 'Ahmed Mohammed', email: 'ahmed@madehhardware.com', role: 'Owner' as const, createdAt: '2024-01-01' },
  { id: '2', name: 'Fatima Hassan', email: 'fatima@madehhardware.com', role: 'Manager' as const, createdAt: '2024-01-15' },
  { id: '3', name: 'Omar Said', email: 'omar@madehhardware.com', role: 'Cashier' as const, createdAt: '2024-02-01' },
  { id: '4', name: 'Staff Member', email: 'staff@madehhardware.com', role: 'Owner' as const, createdAt: '2024-01-01' },
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
    // Demo login - simplified to accept any email/password combination
    if (email && password) {
      const user = DEMO_USERS.find(u => u.email === email) || {
        id: '4',
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        email,
        role: 'Owner' as const,
        createdAt: new Date().toISOString(),
      };
      
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

  // All users now have access to everything
  const hasPermission = (): boolean => {
    return true;
  };

  return {
    ...authState,
    login,
    logout,
    hasPermission,
  };
};
