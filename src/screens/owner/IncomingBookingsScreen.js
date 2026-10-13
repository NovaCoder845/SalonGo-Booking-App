import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../../styles';

// Later: query Firestore "bookings" where salonId == this salon,
// ordered by date/time, with a write to mark a booking as completed.
const PLACEHOLDER_BOOKINGS = [
  { id: 'b1', customer: 'Priya N.', service: 'Manicure', when: 'Today, 11:00', completed: false },
  { id: 'b2', customer: 'Jordan L.', service: 'Haircut', when: 'Today, 14:00', completed: false },
];

const AVATAR_COLORS = ['#D85A30', '#534AB7', '#1D9E75', '#3B6FB5'];

function avatarColor(name) {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export default function IncomingBookingsScreen() {
  const [bookings, setBookings] = useState(PLACEHOLDER_BOOKINGS);

  const markDone = (id) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, completed: true } : b)));
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>Incoming bookings</Text>
      <Text style={s.subtitle}>{bookings.filter((b) => !b.completed).length} upcoming today</Text>

      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.avatar, { backgroundColor: avatarColor(item.customer) }]}>
              <Text style={styles.avatarText}>{item.customer.charAt(0)}</Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.customer}</Text>
              <Text style={styles.detail}>{item.service} · {item.when}</Text>
            </View>

            {item.completed ? (
              <View style={styles.doneBadge}>
                <Ionicons name="checkmark" size={12} color="#1D9E75" />
                <Text style={styles.doneText}>Done</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.doneButton} onPress={() => markDone(item.id)}>
                <Text style={styles.doneButtonText}>Mark done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={32} color="#B9B6AE" />
            <Text style={styles.emptyText}>No bookings yet today.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  detail: {
    fontSize: 12,
    color: '#888780',
    marginTop: 2,
  },
  doneButton: {
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  doneButtonText: {
    color: '#534AB7',
    fontSize: 12,
    fontWeight: '600',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  doneText: {
    color: '#1D9E75',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: '#888780',
    marginTop: 10,
  },
});