import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { theme } from '@/shared/theme';

export interface DatePickerFieldProps {
  value?: string | null; // format: 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Format local Date to 'YYYY-MM-DD' string without UTC timezone shift
 */
export function formatDateToDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse 'YYYY-MM-DD' string into local Date at noon (12:00:00)
 * to prevent any day shift around midnight
 */
export function parseDateStringToLocalDate(str?: string | null): Date {
  if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date();
  }
  const [year, month, day] = str.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formats YYYY-MM-DD for human display (e.g. Nov 8, 2026)
 */
export function formatDisplayDate(str?: string | null): string {
  if (!str) return '';
  const d = parseDateStringToLocalDate(str);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  maxDate,
  minDate,
  disabled = false,
  style,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() =>
    parseDateStringToLocalDate(value)
  );

  const handleOpen = () => {
    if (disabled) return;
    setTempDate(parseDateStringToLocalDate(value));
    setShowPicker(true);
  };

  const handleAndroidChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowPicker(false);
    if (event.type === 'set' && selectedDate) {
      onChange(formatDateToDateString(selectedDate));
    }
  };

  const handleIosConfirm = () => {
    onChange(formatDateToDateString(tempDate));
    setShowPicker(false);
  };

  const handleIosCancel = () => {
    setShowPicker(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.field, disabled && styles.fieldDisabled]}
        onPress={handleOpen}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text
          style={[
            styles.fieldText,
            !value && styles.placeholderText,
          ]}
        >
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Text style={styles.calendarIcon}>📅</Text>
      </TouchableOpacity>

      {/* Android Native Dialog Picker */}
      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS Modal Spinner Picker */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={handleIosCancel}
        >
          <View style={styles.iosModalOverlay}>
            <View style={styles.iosPickerContainer}>
              <View style={styles.iosToolbar}>
                <TouchableOpacity onPress={handleIosCancel} style={styles.iosActionBtn}>
                  <Text style={styles.iosCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosTitleText}>{label || 'Select Date'}</Text>
                <TouchableOpacity onPress={handleIosConfirm} style={styles.iosActionBtn}>
                  <Text style={styles.iosConfirmText}>Done</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                minimumDate={minDate}
                maximumDate={maxDate}
                onChange={(_, date) => date && setTempDate(date)}
                textColor={theme.colors.text}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  fieldText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '500',
  },
  placeholderText: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  calendarIcon: {
    fontSize: 16,
    marginLeft: 8,
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  iosToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  iosTitleText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  iosActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  iosCancelText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  iosConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});

