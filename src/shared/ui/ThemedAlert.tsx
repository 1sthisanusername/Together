import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { theme, scale } from '@/shared/theme';

export interface ThemedAlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface ThemedAlertOptions {
  title: string;
  message?: string;
  buttons?: ThemedAlertButton[];
  emoji?: string;
}

type AlertListener = (alert: ThemedAlertOptions | null) => void;
const listeners = new Set<AlertListener>();
let activeAlert: ThemedAlertOptions | null = null;
let currentResolver: ((button: ThemedAlertButton | null) => void) | null = null;

function emitAlert(alert: ThemedAlertOptions | null) {
  activeAlert = alert;
  listeners.forEach((listener) => listener(alert));
}

export const ThemedAlert = {
  show({
    title,
    message,
    buttons = [{ text: 'OK', style: 'default' }],
    emoji = '💌',
  }: ThemedAlertOptions): Promise<ThemedAlertButton | null> {
    const alertData: ThemedAlertOptions = { title, message, buttons, emoji };
    return new Promise<ThemedAlertButton | null>((resolve) => {
      currentResolver = resolve;
      emitAlert(alertData);
    });
  },
  dismiss() {
    if (activeAlert) {
      currentResolver?.(null);
      currentResolver = null;
      emitAlert(null);
    }
  },
};

export function ThemedAlertDialog() {
  const [alert, setAlert] = React.useState<ThemedAlertOptions | null>(() => activeAlert);

  React.useEffect(() => {
    const listener: AlertListener = (newAlert) => {
      setAlert(newAlert);
    };
    listeners.add(listener);
    // Sync in case alert was shown before effect mounted
    if (activeAlert !== alert) {
      setAlert(activeAlert);
    }
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (!alert) return null;

  const handlePress = (btn: ThemedAlertButton) => {
    const resolver = currentResolver;
    currentResolver = null;
    emitAlert(null);
    if (btn.onPress) {
      try {
        btn.onPress();
      } catch (err) {
        console.warn('[ThemedAlert] button onPress error:', err);
      }
    }
    resolver?.(btn);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}} aria-hidden={!alert}>
      <TouchableWithoutFeedback onPress={() => handlePress({ text: 'OK', style: 'default' })}>
        <View style={styles.backdrop} accessible={true} accessibilityRole="alertdialog" accessibilityLabel={`${alert.title}${alert.message ? `. ${alert.message}` : ''}`}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.card} role="alertdialog">
              <Text style={styles.emoji}>{alert.emoji}</Text>
              <Text style={styles.title}>{alert.title}</Text>
              {alert.message ? <Text style={styles.message}>{alert.message}</Text> : null}
              <View style={styles.buttonRow} accessible={true} accessibilityLabel={`${alert.buttons?.map((b) => b.text).join(', ') || 'OK'}`}>
                {(alert.buttons || []).map((btn, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.btn,
                      btn.style === 'cancel' && styles.btnCancel,
                      btn.style === 'destructive' && styles.btnDestructive,
                    ]}
                    onPress={() => handlePress(btn)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={btn.text}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        btn.style === 'cancel' && styles.btnCancelText,
                        btn.style === 'destructive' && styles.btnDestructiveText,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(62, 39, 35, 0.4)', // cozyNight with 40% opacity for warm modal dimming
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  card: {
    width: '100%',
    maxWidth: scale(340),
    backgroundColor: theme.colors.surface, // #FFFFFF warm white surface
    borderRadius: theme.roundness.lg,
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border, // #FBE9E7 warm blush border
    padding: scale(24),
    alignItems: 'center',
    ...theme.shadows.card, // Soft elevated shadow
  },
  emoji: {
    fontSize: scale(36),
    marginBottom: scale(12),
  },
  title: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(18),
    color: theme.colors.text, // #3E2723 cozy night
    textAlign: 'center',
    marginBottom: scale(10),
  },
  message: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    color: theme.colors.textSecondary, // #7A625A muted
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: scale(24),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: scale(16),
    width: '100%',
    marginTop: scale(16),
  },
  btn: {
    flex: 1,
    height: scale(48),
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border, // #FBE9E7
    backgroundColor: theme.colors.primary, // #D32F2F amour red
  },
  btnCancel: {
    flex: 1,
    height: scale(48),
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.border, // #FBE9E7
    backgroundColor: theme.colors.surfaceSubtle, // #FBE9E7 disabled blush
  },
  btnDestructive: {
    flex: 1,
    height: scale(48),
    borderRadius: theme.roundness.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: theme.borders.subtle,
    borderColor: theme.colors.danger, // #C62828
    backgroundColor: theme.colors.danger, // #C62828
  },
  btnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: theme.colors.textInverse, // #FFFDFB white on red button
  },
  btnCancelText: {
    color: theme.colors.text, // #3E2723 cozy night
    fontFamily: theme.typography.families.bold,
  },
  btnDestructiveText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.families.bold,
  },
});
