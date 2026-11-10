import { create } from 'zustand';
import { TurboModuleRegistry, NativeModules, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, analytics, clearAppCache, push } from '@/services';
import type { Profile } from '@/shared/types';

WebBrowser.maybeCompleteAuthSession();

/**
 * Check if RNGoogleSignin native module is registered in the native binary.
 * Prevents TurboModuleRegistry.getEnforcing from throwing an Invariant Violation
 * when dynamic import('@react-native-google-signin/google-signin') is evaluated.
 */
function isGoogleSigninNativeAvailable(): boolean {
  try {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
      return true;
    }
    if (typeof TurboModuleRegistry !== 'undefined' && typeof TurboModuleRegistry.get === 'function') {
      const tm = TurboModuleRegistry.get('RNGoogleSignin');
      if (tm != null) return true;
    }
    if (typeof NativeModules !== 'undefined' && (NativeModules as any)?.RNGoogleSignin != null) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

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
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
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
      const { data } = await supabase
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

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    // On Web, use standard Supabase OAuth redirect flow
    if (Platform.OS === 'web') {
      try {
        const redirectTo =
          typeof window !== 'undefined'
            ? `${window.location.origin}/auth/callback`
            : undefined;

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          set({ isLoading: false, error: error.message });
          return { error };
        }
        return { error: null };
      } catch (err: any) {
        const error = new Error(err?.message || 'Web Google sign-in failed');
        set({ isLoading: false, error: error.message });
        return { error };
      }
    }

    // Native Android/iOS: In Expo Go or any environment without custom native RNGoogleSignin binary,
    // seamlessly fall back to WebBrowser OAuth so developers and users can sign in and test immediately!
    if (!isGoogleSigninNativeAvailable()) {
      console.log('[GoogleSignin] Native module missing (Expo Go detected). Using WebBrowser OAuth fallback...');
      try {
        const redirectUrl = Linking.createURL('auth/callback');
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) {
          set({ isLoading: false, error: error.message });
          return { error };
        }

        if (data?.url) {
          const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
          if (authResult.type === 'success' && authResult.url) {
            const parsed = Linking.parse(authResult.url);
            const code = parsed.queryParams?.code;
            if (code) {
              const { data: sessionData, error: sessionErr } =
                await supabase.auth.exchangeCodeForSession(String(code));
              if (sessionErr) throw sessionErr;
              if (sessionData.session) {
                set({
                  session: sessionData.session,
                  user: sessionData.user,
                  isLoading: false,
                });
                if (sessionData.user) {
                  await get().fetchProfile(sessionData.user.id);
                  push.registerForPushNotifications(sessionData.user.id).catch(() => {});
                }
                return { error: null };
              }
            } else if (authResult.url.includes('#')) {
              const hash = authResult.url.split('#')[1];
              const params = new URLSearchParams(hash);
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');
              if (accessToken && refreshToken) {
                const { data: sessionData, error: sessionErr } =
                  await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                  });
                if (sessionErr) throw sessionErr;
                if (sessionData.session) {
                  set({
                    session: sessionData.session,
                    user: sessionData.user,
                    isLoading: false,
                  });
                  if (sessionData.user) {
                    await get().fetchProfile(sessionData.user.id);
                    push.registerForPushNotifications(sessionData.user.id).catch(() => {});
                  }
                  return { error: null };
                }
              }
            }
          }

          // Fallback: Check if session was updated in background
          const { data: curSession } = await supabase.auth.getSession();
          if (curSession?.session) {
            set({
              session: curSession.session,
              user: curSession.session.user,
              isLoading: false,
            });
            if (curSession.session.user) {
              await get().fetchProfile(curSession.session.user.id);
            }
            return { error: null };
          }
        }
        set({ isLoading: false, error: null });
        return { error: null };
      } catch (err: any) {
        console.warn('[GoogleSignin] Expo Go browser OAuth error:', err);
        const error = new Error(err?.message || 'Expo Go Google Sign-In failed');
        set({ isLoading: false, error: error.message });
        return { error };
      }
    }

    try {
      let GoogleSignin: any;
      let statusCodes: any;

      try {
        const googleModule = await import('@react-native-google-signin/google-signin');
        GoogleSignin = googleModule.GoogleSignin;
        statusCodes = googleModule.statusCodes;
        if (!GoogleSignin) {
          throw new Error('Google sign-in needs the latest app build');
        }
      } catch (nativeErr: any) {
        console.warn('[GoogleSignin] Native module missing:', nativeErr);
        const error = new Error('Google sign-in needs the latest app build');
        set({ isLoading: false, error: error.message });
        return { error };
      }

      // Configure Google Sign-In dynamically with env vars
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

      if (!webClientId) {
        console.warn('[GoogleSignin] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not configured');
      }

      try {
        GoogleSignin.configure({
          webClientId: webClientId || undefined,
          iosClientId: iosClientId || undefined,
          scopes: ['profile', 'email'],
        });
      } catch (cfgErr) {
        console.warn('[GoogleSignin] Configuration error:', cfgErr);
      }

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || (response as any).idToken;

      if (!idToken) {
        throw new Error('No Google ID token received');
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { error };
      }

      if (data.user) {
        analytics.identify(data.user.id, { email: data.user.email ?? null });
        await get().fetchProfile(data.user.id);
        push.registerForPushNotifications(data.user.id).catch(() => {});
      }

      set({ session: data.session, user: data.user, isLoading: false });
      return { error: null };
    } catch (err: any) {
      if (err?.message?.includes('RNGoogleSignin') || err?.message?.includes('TurboModuleRegistry')) {
        const error = new Error('Google sign-in needs the latest app build');
        set({ isLoading: false, error: error.message });
        return { error };
      }

      try {
        const googleModule = await import('@react-native-google-signin/google-signin');
        const sc = googleModule.statusCodes;
        if (err.code === sc?.SIGN_IN_CANCELLED || err.code === sc?.IN_PROGRESS) {
          set({ isLoading: false });
          return { error: null };
        }
        if (err.code === sc?.PLAY_SERVICES_NOT_AVAILABLE) {
          const error = new Error('Google Play Services is not available');
          set({ isLoading: false, error: error.message });
          return { error };
        }
      } catch {}

      const error = err instanceof Error ? err : new Error(err.message || 'Google sign-in failed');
      set({ isLoading: false, error: error.message });
      return { error };
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      if (isGoogleSigninNativeAvailable()) {
        try {
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          await GoogleSignin.signOut();
        } catch {}
      }
      await supabase.auth.signOut();
      analytics.reset();
      clearAppCache();
      set({ session: null, user: null, profile: null, isLoading: false });
    } catch (err) {
      console.warn('Error during sign out:', err);
      clearAppCache();
      set({ session: null, user: null, profile: null, isLoading: false });
    }
  },

  initAuth: () => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        set({ session, user: session?.user ?? null, isInitialized: true, isLoading: false });
        if (session?.user) {
          await get().fetchProfile(session.user.id);
          push.registerForPushNotifications(session.user.id).catch(() => {});
        } else {
          set({ profile: null });
        }
      }
    );

    // Initial check on launch
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, user: session?.user ?? null, isInitialized: true, isLoading: false });
      if (session?.user) {
        get().fetchProfile(session.user.id);
        push.registerForPushNotifications(session.user.id).catch(() => {});
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  },
}));
