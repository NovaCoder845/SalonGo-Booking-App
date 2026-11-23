import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar/legacy';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../../styles';
import { scheduleBookingReminders } from '../../utils/reminders';

// English and French texts of this screen
const TEXTS = {
  en: {
    title: 'Booking confirmed',
    subtitle: "You're all set — here's your appointment summary",
    date_at: (label, slot) => `${label} at ${slot}`,
    reminders_two: 'Reminders set: 1 day and 1 hour before',
    reminders_one: 'Reminder set before your appointment',
    adding: 'Adding...',
    add_to_calendar: 'Add to calendar',
    view_appointments: 'View my appointments',
    back_to_salons: 'Back to salons',
    permission_needed: 'Permission needed',
    permission_msg: 'Allow calendar access to add this appointment.',
    event_title: (service, salon) => `${service} at ${salon}`,
    event_notes: 'Booked via SalonGo',
    added_title: 'Added to calendar',
    added_msg: 'This appointment has been added to your calendar.',
    calendar_error: 'Could not add to calendar',
    calendar_error_msg: 'Something went wrong adding this event.',
  },
  fr: {
    title: 'Réservation confirmée',
    subtitle: 'Tout est prêt — voici le récapitulatif de votre rendez-vous',
    date_at: (label, slot) => `${label} à ${slot}`,
    reminders_two: 'Rappels activés : 1 jour et 1 heure avant',
    reminders_one: 'Rappel activé avant votre rendez-vous',
    adding: 'Ajout...',
    add_to_calendar: 'Ajouter au calendrier',
    view_appointments: 'Voir mes rendez-vous',
    back_to_salons: 'Retour aux salons',
    permission_needed: 'Autorisation nécessaire',
    permission_msg: "Autorisez l'accès au calendrier pour ajouter ce rendez-vous.",
    event_title: (service, salon) => `${service} chez ${salon}`,
    event_notes: 'Réservé via SalonGo',
    added_title: 'Ajouté au calendrier',
    added_msg: 'Ce rendez-vous a été ajouté à votre calendrier.',
    calendar_error: "Impossible d'ajouter au calendrier",
    calendar_error_msg: "Un problème est survenu lors de l'ajout de cet événement.",
  },
};

// The booking is saved on the Booking screen (together with the "slot taken"
// marker), so this screen shows the result, sets reminders, and offers "Add to calendar".
export default function ConfirmationScreen({ route, navigation }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const { salon, service, slot, date } = route.params;
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [remindersSet, setRemindersSet] = useState(0);

  // Schedule the reminders once when the screen opens
  useEffect(() => {
    (async () => {
      const count = await scheduleBookingReminders({
        salonId: salon.id,
        salonName: salon.name,
        serviceName: service.name,
        dateIso: date.iso,
        time: slot,
      });
      setRemindersSet(count);
    })();
  }, []);

  const addToCalendar = async () => {
    setAddingToCalendar(true);
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(L.permission_needed, L.permission_msg);
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
        title: L.event_title(service.name, salon.name),
        startDate: start,
        endDate: end,
        location: salon.area,
        notes: L.event_notes,
      });

      Alert.alert(L.added_title, L.added_msg);
    } catch (e) {
      console.error('Calendar error', e);
      Alert.alert(L.calendar_error, e?.message || L.calendar_error_msg);
    } finally {
      setAddingToCalendar(false);
    }
  };

  return (
    <View style={s.screen}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark" size={40} color="#fff" />
      </View>

      <Text style={[s.title, { textAlign: 'center' }]}>{L.title}</Text>
      <Text style={[s.subtitle, { textAlign: 'center' }]}>{L.subtitle}</Text>

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
          <Text style={styles.rowText}>{L.date_at(date.label, slot)}</Text>
        </View>
        {remindersSet > 0 && (
          <View style={[styles.row, { marginBottom: 0 }]}>
            <Ionicons name="notifications-outline" size={16} color="#1D9E75" style={styles.rowIcon} />
            <Text style={[styles.rowText, { color: '#1D9E75' }]}>
              {remindersSet === 2 ? L.reminders_two : L.reminders_one}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.calendarButton} onPress={addToCalendar} disabled={addingToCalendar}>
        <Ionicons name="calendar-outline" size={18} color="#534AB7" style={{ marginRight: 8 }} />
        <Text style={styles.calendarText}>{addingToCalendar ? L.adding : L.add_to_calendar}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.button}
        onPress={() => navigation.getParent()?.navigate('Appointments') ?? navigation.popToTop()}
      >
        <Text style={s.buttonText}>{L.view_appointments}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.popToTop()}>
        <Text style={s.linkText}>{L.back_to_salons}</Text>
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