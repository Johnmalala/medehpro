import { useState, useEffect, useCallback } from 'react';
import { AuthUser, AuthState } from '../types';
import { supabase } from '../lib/supabase';
import { AuthError, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchSession = useCallback(async (session: Session | null) => {
    if (session?.user) {
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('id, name, role')
        .eq('email', session.user.email)
        .maybeSingle();

      if (error) {
        console.error('Error fetching staff profile:', error);
      }
      
      if (staffData) {
        const appUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          name: staffData.name,
          role: staffData.role,
          staff_id: staffData.id,
        };
        setAuthState({ user: appUser, isAuthenticated: true, isLoading: false });
      } else {
        const appUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
        };
        setAuthState({ user: appUser, isAuthenticated: true, isLoading: false });
      }
    } else {
      setAuthState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        fetchSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchSession]);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await fetchSession(session);
  }, [fetchSession]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error: AuthError | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { success: !error, error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
  };

  const hasPermission = (): boolean => {
    return true; // Simplified for now
  };

  return {
    ...authState,
    login,
    logout,
    hasPermission,
    refreshUser,
  };
};
