import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../../styles';

// Later: read/write this salon's working-hours + blocked-slots doc in
// Firestore so BookingScreen (customer side) can compute free slots.
const MORNING_SLOTS = ['09:00', '09:30', '10:00', '11:00'];
const AFTERNOON_SLOTS = ['14:00', '14:30', '16:00'];

function SlotSection({ title, slots, open, onToggle }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.slotRow}>
        {slots.map((item) => {
          const isOpen = open.has(item);
          return (
            <TouchableOpacity
              key={item}
              style={[styles.slot, isOpen ? styles.slotOpen : styles.slotClosed]}
              onPress={() => onToggle(item)}
            >
              <Ionicons
                name={isOpen ? 'checkmark-circle' : 'close-circle-outline'}
                size={16}
                color={isOpen ? '#1D9E75' : '#B9B6AE'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.slotText, isOpen ? styles.slotTextOpen : styles.slotTextClosed]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function ManageSlotsScreen() {
  const [open, setOpen] = useState(new Set([...MORNING_SLOTS, ...AFTERNOON_SLOTS]));

  const toggle = (slot) => {
    const next = new Set(open);
    next.has(slot) ? next.delete(slot) : next.add(slot);
    setOpen(next);
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>Manage slots</Text>
      <Text style={s.subtitle}>Tap a slot to open or close it for today</Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Ionicons name="checkmark-circle" size={14} color="#1D9E75" />
          <Text style={styles.legendText}>Open for booking</Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons name="close-circle-outline" size={14} color="#B9B6AE" />
          <Text style={styles.legendText}>Closed</Text>
        </View>
      </View>

      <SlotSection title="Morning" slots={MORNING_SLOTS} open={open} onToggle={toggle} />
      <SlotSection title="Afternoon" slots={AFTERNOON_SLOTS} open={open} onToggle={toggle} />
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#888780',
    marginLeft: 6,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888780',
    marginBottom: 10,
  },
  slotRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  slotOpen: {
    backgroundColor: '#EAF7EF',
    borderColor: '#1D9E75',
  },
  slotClosed: {
    backgroundColor: '#F5F4F1',
    borderColor: '#ddd',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slotTextOpen: {
    color: '#1D9E75',
  },
  slotTextClosed: {
    color: '#B9B6AE',
  },
});