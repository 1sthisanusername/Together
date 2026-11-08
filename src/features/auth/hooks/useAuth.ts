import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase, analytics, clearAppCache } from '@/services';
import type { Profile } from '@/shared/types';
import type { SignUpInput, LoginInput, ResetPasswordInput } from '../schemas';

WebBrowser.maybeCompleteAuthSession();

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
  signUp: (data: SignUpInput) => Promise<{ error: Error | null; session?: Session | null; needsEmailConfirmation?: boolean }>;
  signIn: (data: LoginInput) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
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
        .maybeSingle();

      if (data) {
        set({ profile: data });
        return data;
      }

      // Self-heal: If profile row is missing, auto-create it from the authenticated session user
      const currentUser = get().user;
      const displayName =
        currentUser?.user_metadata?.display_name ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.user_metadata?.name ||
        currentUser?.email?.split('@')[0] ||
        'User';

      const { data: createdProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: currentUser?.email,
          display_name: displayName,
          timezone: 'UTC',
          locale: 'en',
        })
        .select()
        .maybeSingle();

      if (createdProfile) {
        set({ profile: createdProfile });
        return createdProfile;
      }

      if (upsertError) {
        console.warn('Error self-healing profile:', upsertError.message);
      }
      return null;
    } catch (err) {
      console.warn('Unexpected error fetching profile:', err);
      return null;
    }
  },

  signUp: async ({ email, password, displayName }: SignUpInput) => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { error, session: null, needsEmailConfirmation: false };
      }

      let activeSession = data.session;

      // Try automatic immediate login if session was null (works when confirm email is disabled)
      if (!activeSession) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signInError && signInData.session) {
          activeSession = signInData.session;
        }
      }

      if (data.user) {
        analytics.track('account_created');
        analytics.identify(data.user.id, { email });
        if (activeSession) {
          await get().fetchProfile(data.user.id);
        }
      }

      const needsEmailConfirmation = !activeSession;

      set({
        session: activeSession,
        user: activeSession?.user ?? data.user ?? null,
        isLoading: false,
      });

      return { error: null, session: activeSession, needsEmailConfirmation };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Signup failed');
      set({ isLoading: false, error: error.message });
      return { error, session: null, needsEmailConfirmation: false };
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

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const redirectUrl = Linking.createURL('auth/callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { error };
      }

      if (!data?.url) {
        const err = new Error('No OAuth URL returned');
        set({ isLoading: false, error: err.message });
        return { error: err };
      }

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (res.type === 'success' && res.url) {
        const parsed = Linking.parse(res.url);
        const queryParams = parsed.queryParams;

        if (queryParams?.code) {
          const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(
            String(queryParams.code)
          );
          if (sessionError) {
            set({ isLoading: false, error: sessionError.message });
            return { error: sessionError };
          }
          if (sessionData.user) {
            analytics.identify(sessionData.user.id, { email: sessionData.user.email ?? null });
            await get().fetchProfile(sessionData.user.id);
          }
          set({ session: sessionData.session, user: sessionData.user, isLoading: false });
          return { error: null };
        }

        if (res.url.includes('#')) {
          const hash = res.url.split('#')[1];
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              set({ isLoading: false, error: sessionError.message });
              return { error: sessionError };
            }
            if (sessionData.user) {
              analytics.identify(sessionData.user.id, { email: sessionData.user.email ?? null });
              await get().fetchProfile(sessionData.user.id);
            }
            set({ session: sessionData.session, user: sessionData.user, isLoading: false });
            return { error: null };
          }
        }
      }

      set({ isLoading: false });
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Google sign-in failed');
      set({ isLoading: false, error: error.message });
      return { error };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await supabase.auth.signOut();
      analytics.reset();
      clearAppCache();
      set({ session: null, user: null, profile: null, isLoading: false });
    } catch (err) {
      console.warn('Error during sign out:', err);
      clearAppCache();
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

