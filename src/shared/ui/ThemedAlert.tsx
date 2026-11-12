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

let currentResolver: ((button: ThemedAlertButton | null) => void) | null = null;

export const ThemedAlert: { show: (options: ThemedAlertOptions) => void } = {
  show({ title, message, buttons = [{ text: 'OK', style: 'default' }], emoji = '💌' }: ThemedAlertOptions) {
    _pendingAlert = { title, message, buttons, emoji };
    return new Promise<ThemedAlertButton | null>((resolve) => {
      currentResolver = resolve;
    });
  },
};

let _pendingAlert: ThemedAlertOptions | null = null;

export function ThemedAlertDialog() {
  const [alert, setAlert] = React.useState<ThemedAlertOptions | null>(null);

  React.useEffect(() => {
    if (currentResolver && !_pendingAlert) return;
    if (_pendingAlert && !alert) {
      setAlert(_pendingAlert);
      _pendingAlert = null;
    }
  }, [_pendingAlert]);

  // Handle concurrent calls: queue via a tiny state flag
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!_pendingAlert || alert) return;
      setAlert(_pendingAlert);
      _pendingAlert = null;
    }, 50);
    return () => clearInterval(interval);
  }, [alert]);

  if (!alert) return null;

  const handlePress = (btn: ThemedAlertButton) => {
    currentResolver?.(btn);
    currentResolver = null;
    setAlert(null);
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
    backgroundColor: 'rgba(43, 33, 24, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(24),
  },
  card: {
    width: '100%',
    maxWidth: scale(340),
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: scale(22),
    alignItems: 'center',
    ...theme.shadows.card,
  },
  emoji: {
    fontSize: scale(36),
    marginBottom: scale(10),
  },
  title: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(18),
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: scale(8),
  },
  message: {
    fontFamily: theme.typography.families.body,
    fontSize: scale(14),
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: scale(20),
    marginBottom: scale(20),
  },
  buttonRow: {
    flexDirection: 'row',
    gap: scale(12),
    width: '100%',
  },
  btn: {
    flex: 1,
    height: scale(46),
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  btnCancel: {
    backgroundColor: theme.colors.surfaceSubtle,
  },
  btnDestructive: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  btnText: {
    fontFamily: theme.typography.families.bold,
    fontSize: scale(14),
    color: theme.colors.text,
  },
  btnCancelText: {
    color: theme.colors.text,
  },
  btnDestructiveText: {
    color: '#FFFFFF',
  },
});
