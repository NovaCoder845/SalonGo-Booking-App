import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import s from '../../styles';

export default function ConfirmationScreen({ route, navigation }) {
  const { salon, service, slot, date } = route.params;
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  // Save the booking when confirmation is shown so it survives app restarts.
  useEffect(() => {
    addDoc(collection(db, 'bookings'), {
      customerId: auth.currentUser?.uid,
      salon: salon.name,
      service: service.name,
      when: `${date.label}, ${slot}`,
      createdAt: serverTimestamp(),
    }).catch((e) => console.error('Failed to save booking', e));
  }, []);

  const addToCalendar = async () => {
    setAddingToCalendar(true);
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow calendar access to add this appointment.');
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      let calendarId = calendars.find((c) => c.allowsModifications)?.id;

      if (!calendarId) {
        if (Platform.OS === 'ios') {
          const defaultCalendar = await Calendar.getDefaultCalendarAsync();
          calendarId = await Calendar.createCalendarAsync({
            title: 'SalonGo',
            color: '#D85A30',
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: defaultCalendar.source.id,
            source: defaultCalendar.source,
            name: 'SalonGo',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
          });
        } else {
          // Android: a plain local source has no "id", so sourceId must be
          // left out entirely rather than passed as undefined.
          calendarId = await Calendar.createCalendarAsync({
            title: 'SalonGo',
            color: '#D85A30',
            entityType: Calendar.EntityTypes.EVENT,
            source: { isLocalAccount: true, name: 'SalonGo', type: Calendar.SourceType.LOCAL },
            name: 'SalonGo',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
          });
        }
      }

      const [hours, minutes] = slot.split(':').map(Number);
      const [year, month, day] = date.iso.split('-').map(Number);
      const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
      const end = new Date(start.getTime() + (service.durationMin || 30) * 60000);

      await Calendar.createEventAsync(calendarId, {
        title: `${service.name} at ${salon.name}`,
        startDate: start,
        endDate: end,
        location: salon.area,
        notes: 'Booked via SalonGo',
      });

      Alert.alert('Added to calendar', 'This appointment has been added to your calendar.');
    } catch (e) {
      console.error('Calendar error', e);
      Alert.alert('Could not add to calendar', e?.message || 'Something went wrong adding this event.');
    } finally {
      setAddingToCalendar(false);
    }
  };

  return (
    <View style={s.screen}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={40} color="#fff" />
      </View>

      <Text style={[s.title, { textAlign: 'center' }]}>Booking confirmed</Text>
      <Text style={[s.subtitle, { textAlign: 'center' }]}>
        You're all set — here's your appointment summary
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.row}>
          <Ionicons name="cut-outline" size={16} color="#888780" style={styles.rowIcon} />
          <Text style={styles.rowText}>{service.name}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="storefront-outline" size={16} color="#888780" style={styles.rowIcon} />
          <Text style={styles.rowText}>{salon.name}</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} color="#888780" style={styles.rowIcon} />
          <Text style={styles.rowText}>{date.label} at {slot}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.calendarButton} onPress={addToCalendar} disabled={addingToCalendar}>
        <Ionicons name="calendar-outline" size={18} color="#534AB7" style={{ marginRight: 8 }} />
        <Text style={styles.calendarText}>
          {addingToCalendar ? 'Adding...' : 'Add to calendar'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.button}
        onPress={() => navigation.getParent()?.navigate('Appointments') ?? navigation.popToTop()}
      >
        <Text style={s.buttonText}>View my appointments</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.popToTop()}>
        <Text style={s.linkText}>Back to salons</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  successIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#1D9E75',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowIcon: {
    marginRight: 10,
  },
  rowText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 20,
  },
  calendarText: {
    color: '#534AB7',
    fontWeight: '600',
  },
});