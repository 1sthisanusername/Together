import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// Mock dependencies
vi.mock('react-native', () => import('./mocks/react-native'));
vi.mock('react-native-url-polyfill/auto', () => ({}));
vi.mock('expo-secure-store', () => import('./mocks/expo-secure-store'));
vi.mock('@react-native-google-signin/google-signin', () => import('./mocks/google-signin'));

describe('GATE 7: Google-Only Sign-In Architecture', () => {
  it('app.json has @react-native-google-signin/google-signin configured in plugins', () => {
    const appJsonPath = path.resolve(__dirname, '../app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    expect(appJson.expo.plugins).toContain('@react-native-google-signin/google-signin');
  });

  it('legacy email and password screens and forms are deleted', () => {
    const signupScreen = path.resolve(__dirname, '../src/app/(auth)/signup.tsx');
    const resetScreen = path.resolve(__dirname, '../src/app/(auth)/reset-password.tsx');
    const loginForm = path.resolve(__dirname, '../src/features/auth/components/LoginForm.tsx');
    const signUpForm = path.resolve(__dirname, '../src/features/auth/components/SignUpForm.tsx');
    const resetForm = path.resolve(__dirname, '../src/features/auth/components/ResetPasswordForm.tsx');

    expect(fs.existsSync(signupScreen)).toBe(false);
    expect(fs.existsSync(resetScreen)).toBe(false);
    expect(fs.existsSync(loginForm)).toBe(false);
    expect(fs.existsSync(signUpForm)).toBe(false);
    expect(fs.existsSync(resetForm)).toBe(false);
  });

  it('welcome screen (login.tsx) has ONE button for Continue with Google and no email/password inputs', () => {
    const loginScreenPath = path.resolve(__dirname, '../src/app/(auth)/login.tsx');
    const content = fs.readFileSync(loginScreenPath, 'utf8');

    expect(content).toContain('Continue with Google');
    expect(content).toContain('signInWithGoogle');
    // Ensure no password, email input, or navigation to sign up/reset password
    expect(content).not.toContain('Input');
    expect(content).not.toContain('password');
    expect(content).not.toContain('onNavigateToSignUp');
    expect(content).not.toContain('onNavigateToForgotPassword');
  });

  it('useAuthStore reads Google client IDs from env vars and calls signInWithIdToken', () => {
    const useAuthPath = path.resolve(__dirname, '../src/features/auth/hooks/useAuth.ts');
    const content = fs.readFileSync(useAuthPath, 'utf8');

    expect(content).toContain('process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID');
    expect(content).toContain('GoogleSignin.configure');
    expect(content).toContain('GoogleSignin.signIn');
    expect(content).toContain('signInWithIdToken');
    expect(content).toContain('GoogleSignin.signOut');
  });

  it('couple routing after sign-in remains intact in RootRouteGuard', () => {
    const layoutPath = path.resolve(__dirname, '../src/app/_layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');

    expect(content).toContain("case 'NO_COUPLE':");
    expect(content).toContain("router.replace('/(auth)/pair')");
    expect(content).toContain("case 'PENDING':");
    expect(content).toContain("case 'ACTIVE':");
    expect(content).toContain("router.replace('/(tabs)/home')");
  });
});

