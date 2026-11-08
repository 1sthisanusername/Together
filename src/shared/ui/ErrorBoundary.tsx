import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/shared/theme';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackRender?: (props: { error: Error; reset: () => void }) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ErrorBoundary] Caught error:', error?.message, errorInfo?.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackRender && this.state.error) {
        return this.props.fallbackRender({ error: this.state.error, reset: this.reset });
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.defaultContainer}>
          <Text style={styles.defaultEmoji}>⚠️</Text>
          <Text style={styles.defaultTitle}>Something went wrong</Text>
          <Text style={styles.defaultSubtitle}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={this.reset} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * MessageErrorBoundary: Specific lightweight fallback for individual chat bubbles
 * Isolates message rendering crashes so the rest of the chat remains fully responsive.
 */
export const MessageErrorBoundary: React.FC<{ children: ReactNode; isMyMessage?: boolean }> = ({
  children,
  isMyMessage = false,
}) => (
  <ErrorBoundary
    fallbackRender={({ reset }) => (
      <View
        style={[
          styles.bubbleErrorContainer,
          isMyMessage ? styles.myBubbleError : styles.partnerBubbleError,
        ]}
      >
        <Text style={styles.bubbleErrorText}>⚠️ Can't play or show message</Text>
        <TouchableOpacity
          onPress={reset}
          style={styles.bubbleRetryBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.bubbleRetryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    )}
  >
    {children}
  </ErrorBoundary>
);

/**
 * GameErrorBoundary: Activity/Game screen recovery fallback
 * Prevents game crashes from killing the entire app session.
 */
export const GameErrorBoundary: React.FC<{ children: ReactNode; onExit?: () => void }> = ({
  children,
  onExit,
}) => (
  <ErrorBoundary
    fallbackRender={({ error, reset }) => (
      <View style={styles.gameErrorContainer}>
        <Text style={styles.gameErrorEmoji}>🎮</Text>
        <Text style={styles.gameErrorTitle}>Activity Paused</Text>
        <Text style={styles.gameErrorSubtitle}>
          {error?.message ? `Notice: ${error.message}` : 'This game screen hit an unexpected issue.'}
        </Text>
        <View style={styles.gameBtnRow}>
          <TouchableOpacity style={styles.gameRetryBtn} onPress={reset} activeOpacity={0.8}>
            <Text style={styles.gameRetryText}>Reload Activity</Text>
          </TouchableOpacity>
          {onExit && (
            <TouchableOpacity style={styles.gameExitBtn} onPress={onExit} activeOpacity={0.8}>
              <Text style={styles.gameExitText}>Back to Home</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )}
  >
    {children}
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  defaultContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    margin: 8,
  },
  defaultEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  defaultSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginVertical: 4,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.sm,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  bubbleErrorContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
  },
  myBubbleError: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FFB8B8',
  },
  partnerBubbleError: {
    backgroundColor: '#FFF8E7',
    borderColor: '#FFDC82',
  },
  bubbleErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
  },
  bubbleRetryBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleRetryText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  gameErrorContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    shadowColor: '#2B2118',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  gameErrorEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  gameErrorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  gameErrorSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  gameBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gameRetryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
  },
  gameRetryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  gameExitBtn: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
  },
  gameExitText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
});

