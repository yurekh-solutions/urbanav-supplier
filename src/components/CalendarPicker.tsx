import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight in-app month calendar picker (no native date-picker dependency).
// Works on iOS, Android, and web. Returns a date as `YYYY-MM-DD` string.
// ─────────────────────────────────────────────────────────────────────────────

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January',   'February', 'March',    'April',
  'May',       'June',     'July',     'August',
  'September', 'October',  'November', 'December',
];

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseYmd(s: string | undefined | null): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const offset = first.getDay(); // 0..6, Sun..Sat
  const days: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export interface CalendarPickerProps {
  visible: boolean;
  value?: string;               // YYYY-MM-DD
  minDate?: Date;               // defaults to today — prevents past dates
  onClose: () => void;
  onSelect: (ymd: string) => void;
  accentColor?: string;         // brand highlight for selected day
}

export default function CalendarPicker({
  visible,
  value,
  minDate,
  onClose,
  onSelect,
  accentColor = '#7A3DFF',
}: CalendarPickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const floor = minDate ?? today;

  const initial = parseYmd(value) ?? today;
  const [viewYear, setViewYear]   = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const step = (dir: 1 | -1) => {
    let y = viewYear;
    let m = viewMonth + dir;
    if (m < 0)  { m = 11; y -= 1; }
    if (m > 11) { m = 0;  y += 1; }
    setViewYear(y);
    setViewMonth(m);
  };

  const selectedYmd = value || '';

  const pick = (d: Date) => {
    if (d.getTime() < floor.getTime()) return;
    onSelect(toYmd(d));
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.backdrop}
      >
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step(-1)} hitSlop={8} style={styles.navBtn}>
              <ChevronLeft size={20} color="#1A0E2B" />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={() => step(1)} hitSlop={8} style={styles.navBtn}>
              <ChevronRight size={20} color="#1A0E2B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={[styles.navBtn, { marginLeft: 8 }]}>
              <X size={18} color="#1A0E2B" />
            </TouchableOpacity>
          </View>

          {/* Weekday row */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={styles.weekLabel}>{w}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {grid.map((d, i) => {
              if (!d) return <View key={i} style={styles.cell} />;
              const ymd       = toYmd(d);
              const isPast    = d.getTime() < floor.getTime();
              const isToday   = d.getTime() === today.getTime();
              const isChosen  = ymd === selectedYmd;

              return (
                <TouchableOpacity
                  key={i}
                  disabled={isPast}
                  onPress={() => pick(d)}
                  activeOpacity={0.7}
                  style={[
                    styles.cell,
                    isChosen && { backgroundColor: accentColor, borderRadius: 18 },
                    !isChosen && isToday && { borderWidth: 1.5, borderColor: accentColor, borderRadius: 18 },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: isChosen || isToday ? '700' : '500',
                      color: isChosen ? '#fff' : isPast ? '#BFB3D4' : '#1A0E2B',
                    }}
                  >
                    {d.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.ghostBtn}>
              <Text style={{ color: '#6B5C86', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pick(today)}
              style={[styles.ghostBtn, { backgroundColor: `${accentColor}18` }]}
            >
              <Text style={{ color: accentColor, fontWeight: '700' }}>Today</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const CELL = 40;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 4, 20, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3EDFF',
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: '#1A0E2B',
    letterSpacing: 0.2,
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#8A7BA4',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
