import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, analytics } from '@/services';
import type { Profile } from '@/shared/types';
import type { SignUpInput, LoginInput, ResetPasswordInput } from '../schemas';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signUp: (data: SignUpInput) => Promise<{ error: Error | null }>;
  signIn: (data: LoginInput) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (data: ResetPasswordInput) => Promise<{ error: Error | null }>;
  fetchProfile: (userId: string) => Promise<Profile | null>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  setSession: (session) =>
    set({ session, user: session?.user ?? null, isLoading: false }),

  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching profile:', error.message);
        return null;
      }
      set({ profile: data });
      return data;
    } catch (err) {
      console.warn('Unexpected error fetching profile:', err);
      return null;
    }
  },

  signUp: async ({ email, password, displayName }: SignUpInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { error };
      }

      if (data.user) {
        analytics.track('account_created');
        analytics.identify(data.user.id, { email });
        await get().fetchProfile(data.user.id);
      }

      set({ session: data.session, user: data.user, isLoading: false });
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Signup failed');
      set({ isLoading: false, error: error.message });
      return { error };
    }
  },

  signIn: async ({ email, password }: LoginInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { error };
      }

      if (data.user) {
        analytics.identify(data.user.id, { email: data.user.email ?? null });
        await get().fetchProfile(data.user.id);
      }

      set({ session: data.session, user: data.user, isLoading: false });
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      set({ isLoading: false, error: error.message });
      return { error };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      analytics.reset();
      set({ session: null, user: null, profile: null, isLoading: false });
    } catch (err) {
      console.warn('Error during sign out:', err);
      set({ isLoading: false });
    }
  },

  resetPassword: async ({ email }: ResetPasswordInput) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      set({ isLoading: false, error: error?.message ?? null });
      return { error: error ? new Error(error.message) : null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Reset failed');
      set({ isLoading: false, error: error.message });
      return { error };
    }
  },

  initAuth: () => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        set({ session, user: session?.user ?? null, isInitialized: true, isLoading: false });
        if (session?.user) {
          await get().fetchProfile(session.user.id);
        } else {
          set({ profile: null });
        }
      }
    );

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isInitialized: true, isLoading: false });
      if (session?.user) {
        get().fetchProfile(session.user.id);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  },
}));

