import { Ionicons } from '@expo/vector-icons';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import s from '../../styles';

// English and French texts of this screen
const TEXTS = {
  en: {
    your_salon: 'Your salon',
    subtitle: "Here's what's happening today",
    setup_title: 'Set up your salon',
    setup_text: "Customers can't find you until you add your salon details.",
    bookings_today: 'Bookings today',
    next_appointment: 'Next appointment',
    manage: 'Manage',
    my_salon: 'My salon',
    my_salon_sub: 'Name, location and services',
    slots: 'Available slots',
    slots_sub: 'Choose the times customers can book',
    portfolio: 'Portfolio photos',
    portfolio_sub: 'Showcase your work to new customers',
  },
  fr: {
    your_salon: 'Votre salon',
    subtitle: "Voici ce qui se passe aujourd'hui",
    setup_title: 'Configurez votre salon',
    setup_text: 'Les clients ne peuvent pas vous trouver tant que vous nʼavez pas ajouté les détails de votre salon.',
    bookings_today: "Réservations aujourd'hui",
    next_appointment: 'Prochain rendez-vous',
    manage: 'Gérer',
    my_salon: 'Mon salon',
    my_salon_sub: 'Nom, adresse et services',
    slots: 'Créneaux disponibles',
    slots_sub: 'Choisissez les heures réservables par les clients',
    portfolio: 'Photos du portfolio',
    portfolio_sub: 'Montrez votre travail aux nouveaux clients',
  },
};

// Today's date as YYYY-MM-DD (same format the booking screen saves)
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function OwnerDashboardScreen({ navigation }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const uid = auth.currentUser?.uid;
  const [salon, setSalon] = useState(undefined); // undefined = still loading, null = not created yet
  const [todayBookings, setTodayBookings] = useState([]);
  const [now, setNow] = useState(new Date());

  // Keep the clock fresh so "Next appointment" never shows a time that has passed
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // My salon (document id = my user id)
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'salons', uid),
      (snap) => setSalon(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      (err) => {
        console.log('Salon error', err);
        setSalon(null);
      }
    );
    return unsub;
  }, [uid]);

  // Bookings made at my salon for today
  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('salonOwnerId', '==', uid),
      where('date', '==', todayIso())
    );
    const unsub = onSnapshot(
      q,
      (snap) => setTodayBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.log('Bookings error', err)
    );
    return unsub;
  }, [uid]);

  // Stats
  const active = todayBookings.filter((b) => b.status !== 'cancelled');
  const pad = (n) => String(n).padStart(2, '0');
  const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  // Next appointment = still to come today, and not already done or cancelled
  const upcoming = active
    .filter((b) => b.status !== 'completed')
    .map((b) => b.time)
    .filter((t) => t && t >= nowHHMM)
    .sort();
  const nextSlot = upcoming.length ? upcoming[0] : '—';

  const openBookings = () => navigation.navigate('Bookings');

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{salon?.name || L.your_salon}</Text>
        <Text style={s.subtitle}>{L.subtitle}</Text>

        {salon === null && (
          <TouchableOpacity style={styles.setupBanner} onPress={() => navigation.navigate('MySalon')}>
            <Ionicons name="alert-circle-outline" size={22} color="#D85A30" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.setupTitle}>{L.setup_title}</Text>
              <Text style={styles.setupText}>{L.setup_text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#D85A30" />
          </TouchableOpacity>
        )}

        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={openBookings}>
            <View style={styles.statIcon}>
              <Ionicons name="calendar" size={18} color="#534AB7" />
            </View>
            <Text style={styles.statValue}>{active.length}</Text>
            <Text style={styles.statLabel}>{L.bookings_today}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={openBookings}>
            <View style={styles.statIcon}>
              <Ionicons name="time" size={18} color="#534AB7" />
            </View>
            <Text style={styles.statValue}>{nextSlot}</Text>
            <Text style={styles.statLabel}>{L.next_appointment}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>{L.manage}</Text>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MySalon')}>
          <View style={[styles.actionIcon, { backgroundColor: '#FBEAE2' }]}>
            <Ionicons name="storefront-outline" size={20} color="#D85A30" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{L.my_salon}</Text>
            <Text style={styles.actionSubtitle}>{L.my_salon_sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B9B6AE" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('ManageSlots')}>
          <View style={[styles.actionIcon, { backgroundColor: '#EFEDFA' }]}>
            <Ionicons name="time-outline" size={20} color="#534AB7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{L.slots}</Text>
            <Text style={styles.actionSubtitle}>{L.slots_sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B9B6AE" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Portfolio')}>
          <View style={[styles.actionIcon, { backgroundColor: '#EFEDFA' }]}>
            <Ionicons name="images-outline" size={20} color="#534AB7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>{L.portfolio}</Text>
            <Text style={styles.actionSubtitle}>{L.portfolio_sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#B9B6AE" />
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  setupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBEAE2',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  setupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A0401F',
  },
  setupText: {
    fontSize: 12,
    color: '#A0401F',
    marginTop: 2,
  },
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