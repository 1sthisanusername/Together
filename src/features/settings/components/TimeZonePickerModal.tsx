import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '@/shared/theme';

export interface TimeZonePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
}

export function getUtcOffsetString(tz: string, date: Date = new Date()): string {
  try {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    const diffMins = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
    const sign = diffMins >= 0 ? '+' : '-';
    const absMins = Math.abs(diffMins);
    const hours = Math.floor(absMins / 60).toString().padStart(2, '0');
    const mins = (absMins % 60).toString().padStart(2, '0');
    return `UTC${sign}${hours}:${mins}`;
  } catch {
    return 'UTC+00:00';
  }
}

// Fallback list of major IANA time zones
const FALLBACK_ZONES = [
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  'America/Anchorage', 'America/Argentina/Buenos_Aires', 'America/Bogota',
  'America/Chicago', 'America/Denver', 'America/Halifax', 'America/Lima',
  'America/Los_Angeles', 'America/Mexico_City', 'America/New_York',
  'America/Phoenix', 'America/Santiago', 'America/Sao_Paulo', 'America/Toronto',
  'America/Vancouver', 'Asia/Bangkok', 'Asia/Dubai', 'Asia/Hong_Kong',
  'Asia/Jakarta', 'Asia/Jerusalem', 'Asia/Karachi', 'Asia/Kolkata',
  'Asia/Kuala_Lumpur', 'Asia/Manila', 'Asia/Seoul', 'Asia/Shanghai',
  'Asia/Singapore', 'Asia/Taipei', 'Asia/Tokyo', 'Atlantic/Reykjavik',
  'Australia/Adelaide', 'Australia/Brisbane', 'Australia/Melbourne',
  'Australia/Perth', 'Australia/Sydney', 'Europe/Amsterdam', 'Europe/Athens',
  'Europe/Berlin', 'Europe/Brussels', 'Europe/Dublin', 'Europe/Helsinki',
  'Europe/Istanbul', 'Europe/Lisbon', 'Europe/London', 'Europe/Madrid',
  'Europe/Moscow', 'Europe/Paris', 'Europe/Rome', 'Europe/Stockholm',
  'Europe/Vienna', 'Europe/Warsaw', 'Europe/Zurich', 'Pacific/Auckland',
  'Pacific/Fiji', 'Pacific/Honolulu', 'UTC'
];

function getAllIanaZones(): string[] {
  try {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      const zones = (Intl as any).supportedValuesOf('timeZone') as string[];
      if (Array.isArray(zones) && zones.length > 0) {
        return zones;
      }
    }
  } catch {
    // fallback
  }
  return FALLBACK_ZONES;
}

export const TimeZonePickerModal: React.FC<TimeZonePickerModalProps> = ({
  visible,
  onClose,
  selectedZone,
  onSelectZone,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-detect device zone
  const detectedZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const detectedOffset = useMemo(() => getUtcOffsetString(detectedZone), [detectedZone]);

  const allZones = useMemo(() => {
    const rawList = getAllIanaZones();
    const now = new Date();
    return rawList.map((tz) => ({
      name: tz,
      offset: getUtcOffsetString(tz, now),
      displayLabel: tz.replace(/_/g, ' '),
    }));
  }, []);

  const filteredZones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allZones;
    return allZones.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.displayLabel.toLowerCase().includes(q) ||
        item.offset.toLowerCase().includes(q)
    );
  }, [allZones, searchQuery]);

  const handleSelect = (zoneName: string) => {
    onSelectZone(zoneName);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Time Zone</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search time zones (e.g. Kolkata, London, UTC)..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>

          {/* Detected Section (Top) */}
          <View style={styles.detectedSection}>
            <Text style={styles.sectionHeader}>DEVICE DETECTED</Text>
            <TouchableOpacity
              style={[
                styles.zoneRow,
                styles.detectedRow,
                selectedZone === detectedZone && styles.selectedRow,
              ]}
              onPress={() => handleSelect(detectedZone)}
            >
              <View style={styles.zoneTextCol}>
                <View style={styles.detectedLabelRow}>
                  <Text style={styles.zoneName}>{detectedZone.replace(/_/g, ' ')}</Text>
                  <View style={styles.detectedBadge}>
                    <Text style={styles.detectedBadgeText}>Detected</Text>
                  </View>
                </View>
                <Text style={styles.zoneSub}>{detectedZone}</Text>
              </View>
              <View style={styles.offsetCol}>
                <Text style={styles.offsetText}>{detectedOffset}</Text>
                {selectedZone === detectedZone && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          </View>

          {/* All Zones List */}
          <View style={styles.listSection}>
            <Text style={styles.sectionHeader}>
              ALL TIME ZONES ({filteredZones.length})
            </Text>
            <FlatList
              data={filteredZones}
              keyExtractor={(item) => item.name}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={30}
              renderItem={({ item }) => {
                const isSelected = selectedZone === item.name;
                return (
                  <TouchableOpacity
                    style={[styles.zoneRow, isSelected && styles.selectedRow]}
                    onPress={() => handleSelect(item.name)}
                  >
                    <View style={styles.zoneTextCol}>
                      <Text style={[styles.zoneName, isSelected && styles.selectedZoneText]}>
                        {item.displayLabel}
                      </Text>
                      <Text style={styles.zoneSub}>{item.name}</Text>
                    </View>
                    <View style={styles.offsetCol}>
                      <Text style={[styles.offsetText, isSelected && styles.selectedOffsetText]}>
                        {item.offset}
                      </Text>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  searchInput: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.text,
  },
  detectedSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  detectedRow: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
  },
  detectedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detectedBadge: {
    backgroundColor: theme.colors.primaryLight || '#eedfd7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  detectedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  selectedRow: {
    backgroundColor: '#FAF5F2',
    borderColor: theme.colors.primary,
  },
  zoneTextCol: {
    flex: 1,
    marginRight: 12,
  },
  zoneName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  selectedZoneText: {
    color: theme.colors.primary,
  },
  zoneSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  offsetCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offsetText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  selectedOffsetText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
  },
});
