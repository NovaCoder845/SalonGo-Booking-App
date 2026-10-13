import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../../styles';

// Placeholder stats — later these come from a Firestore query on this
// owner's salon: count of today's bookings, soonest upcoming slot.
const TODAY_BOOKINGS = 3;
const NEXT_SLOT = '14:00';

export default function OwnerDashboardScreen({ navigation }) {
  return (
    <View style={s.screen}>
      <Text style={s.title}>Your salon</Text>
      <Text style={s.subtitle}>Here's what's happening today</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="calendar" size={18} color="#534AB7" />
          </View>
          <Text style={styles.statValue}>{TODAY_BOOKINGS}</Text>
          <Text style={styles.statLabel}>Bookings today</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="time" size={18} color="#534AB7" />
          </View>
          <Text style={styles.statValue}>{NEXT_SLOT}</Text>
          <Text style={styles.statLabel}>Next appointment</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Manage</Text>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ManageSlots')}>
        <View style={[styles.actionIcon, { backgroundColor: '#EFEDFA' }]}>
          <Ionicons name="time-outline" size={20} color="#534AB7" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>Available slots</Text>
          <Text style={styles.actionSubtitle}>Open or block out times customers can book</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#B9B6AE" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Portfolio')}>
        <View style={[styles.actionIcon, { backgroundColor: '#EFEDFA' }]}>
          <Ionicons name="images-outline" size={20} color="#534AB7" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionTitle}>Portfolio photos</Text>
          <Text style={styles.actionSubtitle}>Showcase your work to new customers</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#B9B6AE" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFEDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  statLabel: {
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
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#888780',
    marginTop: 2,
  },
});