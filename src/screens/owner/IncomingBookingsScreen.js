import { Ionicons } from '@expo/vector-icons';
import { collection, doc, onSnapshot, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import s from '../../styles';

// English and French texts of this screen
const TEXTS = {
  en: {
    title: 'Incoming bookings',
    upcoming_count: (n) => `${n} upcoming`,
    tab_upcoming: 'Upcoming',
    tab_history: 'History',
    empty_upcoming: 'No upcoming bookings yet',
    empty_history: 'No past bookings yet',
    customer: 'Customer',
    this_customer: 'this customer',
    completed: 'Completed',
    cancelled: 'Cancelled',
    past: 'Past',
    cancel: 'Cancel',
    mark_done: 'Mark done',
    mark_title: 'Mark as done',
    mark_message: (service, who) => `Mark ${service} for ${who} as done?`,
    could_not_update: 'Could not update',
    cancel_title: 'Cancel this booking?',
    cancel_message: (service, who, when) =>
      `${service} for ${who}\n${when}\n\nThe customer will see it as cancelled, and this time becomes free again.`,
    keep_it: 'No, keep it',
    yes_cancel: 'Yes, cancel',
    could_not_cancel: 'Could not cancel',
  },
  fr: {
    title: 'Réservations reçues',
    upcoming_count: (n) => `${n} à venir`,
    tab_upcoming: 'À venir',
    tab_history: 'Historique',
    empty_upcoming: 'Aucune réservation à venir',
    empty_history: 'Aucune réservation passée',
    customer: 'Client',
    this_customer: 'ce client',
    completed: 'Terminée',
    cancelled: 'Annulée',
    past: 'Passée',
    cancel: 'Annuler',
    mark_done: 'Terminé',
    mark_title: 'Marquer comme terminé',
    mark_message: (service, who) => `Marquer « ${service} » pour ${who} comme terminé ?`,
    could_not_update: 'Mise à jour impossible',
    cancel_title: 'Annuler cette réservation ?',
    cancel_message: (service, who, when) =>
      `${service} pour ${who}\n${when}\n\nLe client la verra comme annulée, et cet horaire redevient libre.`,
    keep_it: 'Non, la garder',
    yes_cancel: 'Oui, annuler',
    could_not_cancel: "Annulation impossible",
  },
};

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const AVATAR_COLORS = ['#534AB7', '#D85A30', '#1D9E75', '#3B6FB5'];

export default function IncomingBookingsScreen() {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const uid = auth.currentUser?.uid;
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('Upcoming'); // inside the code the tab names stay in English

  // All bookings made at my salon
  useEffect(() => {
    const q = query(collection(db, 'bookings'), where('salonOwnerId', '==', uid));
    const unsub = onSnapshot(
      q,
      (snap) => setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((b) => b.date)),
      (err) => console.log('Bookings error', err)
    );
    return unsub;
  }, [uid]);

  const today = todayIso();
  const byTime = (a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);

  const upcoming = bookings
    .filter((b) => b.status === 'confirmed' && b.date >= today)
    .sort(byTime);
  const history = bookings
    .filter((b) => !(b.status === 'confirmed' && b.date >= today))
    .sort((a, b) => byTime(b, a));

  const list = tab === 'Upcoming' ? upcoming : history;

  const markDone = (booking) => {
    Alert.alert(L.mark_title, L.mark_message(booking.service, booking.customerName || L.this_customer), [
      { text: L.cancel, style: 'cancel' },
      {
        text: L.mark_done,
        onPress: () =>
          updateDoc(doc(db, 'bookings', booking.id), { status: 'completed' }).catch((e) =>
            Alert.alert(L.could_not_update, e.message)
          ),
      },
    ]);
  };

  // The salon owner cancels a booking: it is marked cancelled and the time is freed again
  const cancelBooking = (booking) => {
    Alert.alert(
      L.cancel_title,
      L.cancel_message(booking.service, booking.customerName || L.this_customer, booking.when),
      [
        { text: L.keep_it, style: 'cancel' },
        {
          text: L.yes_cancel,
          style: 'destructive',
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              batch.update(doc(db, 'bookings', booking.id), { status: 'cancelled' });
              // free the time slot (same name the booking screen used when it locked it)
              batch.delete(doc(db, 'slots', `${booking.salonId}_${booking.date}_${booking.time}`));
              await batch.commit();
            } catch (e) {
              console.log('Cancel booking error', e);
              Alert.alert(L.could_not_cancel, e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>{L.title}</Text>
      <Text style={s.subtitle}>{L.upcoming_count(upcoming.length)}</Text>

      <View style={styles.tabRow}>
        {['Upcoming', 'History'].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tabPill, tab === t && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'Upcoming' ? L.tab_upcoming : L.tab_history}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={32} color="#C9C7C0" />
            <Text style={styles.emptyText}>{tab === 'Upcoming' ? L.empty_upcoming : L.empty_history}</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const name = item.customerName || L.customer;
          const isUpcoming = item.status === 'confirmed' && item.date >= today;
          return (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] }]}>
                  <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{name}</Text>
                  <Text style={s.cardSubtitle}>
                    {item.service} · {item.when}
                  </Text>
                  {!isUpcoming && (
                    <Text
                      style={[
                        styles.status,
                        item.status === 'completed' && { color: '#1D9E75' },
                        item.status === 'cancelled' && { color: '#C0392B' },
                      ]}
                    >
                      {item.status === 'completed' ? L.completed : item.status === 'cancelled' ? L.cancelled : L.past}
                    </Text>
                  )}
                </View>
              </View>

              {isUpcoming && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => cancelBooking(item)}>
                    <Text style={styles.cancelText}>{L.cancel}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.doneButton} onPress={() => markDone(item)}>
                    <Text style={styles.doneText}>{L.mark_done}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  tabPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  tabPillActive: {
    backgroundColor: '#534AB7',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888780',
    marginTop: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  doneButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 10,
    paddingVertical: 9,
  },
  doneText: {
    color: '#534AB7',
    fontWeight: '600',
    fontSize: 13,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C0392B',
    borderRadius: 10,
    paddingVertical: 9,
  },
  cancelText: {
    color: '#C0392B',
    fontWeight: '600',
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888780',
    fontSize: 14,
    marginTop: 10,
  },
});