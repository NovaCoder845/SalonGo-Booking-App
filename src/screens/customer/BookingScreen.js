import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../../styles';

// Later, this becomes the real logic centerpiece:
// 1. Query Firestore for this salon's bookings on the selected date.
// 2. Compute which slots are still free (compare against salon's working hours).
// 3. On confirm, write a new booking doc inside a transaction so two
//    customers can't grab the same slot at once.
const MORNING_SLOTS = ['09:00', '09:30', '10:00', '11:00'];
const AFTERNOON_SLOTS = ['14:00', '14:30', '16:00'];

function getNextDays(count = 7) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    days.push({
      iso,
      chipLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : weekday,
      dayNum,
      month,
      fullLabel: i === 0 ? `Today, ${dayNum} ${month}` : `${weekday}, ${dayNum} ${month}`,
    });
  }
  return days;
}

function DaySelector({ days, selectedIso, onSelect }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionLabel}>Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {days.map((day) => {
          const active = selectedIso === day.iso;
          return (
            <TouchableOpacity
              key={day.iso}
              style={[styles.dayChip, active && styles.dayChipActive]}
              onPress={() => onSelect(day.iso)}
            >
              <Text style={[styles.dayChipTop, active && styles.dayChipTextActive]}>{day.chipLabel}</Text>
              <Text style={[styles.dayChipBottom, active && styles.dayChipTextActive]}>
                {day.dayNum} {day.month}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SlotGrid({ title, slots, selectedSlot, onSelect }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.slotRow}>
        {slots.map((item) => {
          const active = selectedSlot === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.slot, active && styles.slotActive]}
              onPress={() => onSelect(item)}
            >
              {active && <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} />}
              <Text style={[styles.slotText, active && styles.slotTextActive]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function BookingScreen({ route, navigation }) {
  const { salon, service } = route.params;
  const days = getNextDays(7);
  const [selectedIso, setSelectedIso] = useState(days[0].iso);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const selectedDay = days.find((d) => d.iso === selectedIso);

  const handleConfirm = () => {
    if (!selectedSlot) return;
    navigation.navigate('Confirmation', {
      salon,
      service,
      slot: selectedSlot,
      date: { iso: selectedDay.iso, label: selectedDay.fullLabel },
    });
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>Book appointment</Text>
      <Text style={s.subtitle}>Pick a date and an available time</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="cut" size={20} color="#D85A30" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{service.name}</Text>
          <Text style={s.cardSubtitle}>{salon.name}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>Rs {service.price}</Text>
          <Text style={styles.duration}>{service.durationMin} min</Text>
        </View>
      </View>

      <DaySelector days={days} selectedIso={selectedIso} onSelect={setSelectedIso} />

      <SlotGrid title="Morning" slots={MORNING_SLOTS} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />
      <SlotGrid title="Afternoon" slots={AFTERNOON_SLOTS} selectedSlot={selectedSlot} onSelect={setSelectedSlot} />

      <TouchableOpacity
        style={[s.button, !selectedSlot && styles.buttonDisabled]}
        onPress={handleConfirm}
        disabled={!selectedSlot}
      >
        <Text style={s.buttonText}>
          {selectedSlot ? `Confirm ${selectedDay.chipLabel}, ${selectedSlot}` : 'Select a time to continue'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FBEAE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D85A30',
  },
  duration: {
    fontSize: 12,
    color: '#888780',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888780',
    marginBottom: 10,
  },
  dayChip: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 10,
    minWidth: 64,
  },
  dayChipActive: {
    backgroundColor: '#D85A30',
    borderColor: '#D85A30',
  },
  dayChipTop: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  dayChipBottom: {
    fontSize: 12,
    color: '#888780',
    marginTop: 2,
  },
  dayChipTextActive: {
    color: '#fff',
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
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  slotActive: {
    backgroundColor: '#D85A30',
    borderColor: '#D85A30',
  },
  slotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#E8D9CE',
  },
});