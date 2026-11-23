import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import s from '../../styles';
import { AFTERNOON_SLOTS, MORNING_SLOTS, openSlotsOf } from '../../utils/slots';

// The next days, with names in the app's language
function getNextDays(count, locale, t) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const weekday = d.toLocaleDateString(locale, { weekday: 'short' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString(locale, { month: 'short' });
    days.push({
      iso,
      chipLabel: i === 0 ? t('today') : i === 1 ? t('tomorrow') : weekday,
      dayNum,
      month,
      fullLabel: i === 0 ? `${t('today')}, ${dayNum} ${month}` : `${weekday}, ${dayNum} ${month}`,
    });
  }
  return days;
}

function DaySelector({ days, selectedIso, onSelect, label }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
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

function SlotGrid({ title, slots, selectedSlot, onSelect, isUnavailable }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.slotRow}>
        {slots.map((item) => {
          const active = selectedSlot === item;
          const unavailable = isUnavailable(item);
          return (
            <TouchableOpacity
              key={item}
              disabled={unavailable}
              style={[styles.slot, active && styles.slotActive, unavailable && styles.slotTaken]}
              onPress={() => onSelect(item)}
            >
              {active && <Ionicons name="checkmark" size={14} color="#fff" style={{ marginRight: 4 }} />}
              <Text
                style={[
                  styles.slotText,
                  active && styles.slotTextActive,
                  unavailable && styles.slotTextTaken,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function BookingScreen({ route, navigation }) {
  const { t, i18n } = useTranslation();
  const { salon, service } = route.params;
  const locale = i18n.language && i18n.language.startsWith('fr') ? 'fr-FR' : 'en-GB';
  const days = getNextDays(7, locale, t);
  const [selectedIso, setSelectedIso] = useState(days[0].iso);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [takenSlots, setTakenSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  const selectedDay = days.find((d) => d.iso === selectedIso);

  // The price as the owner wrote it (e.g. "From Rs 500"), or "Rs 500" for older services
  const priceLabel = service.priceText || `Rs ${service.price}`;

  // Only the times this salon's owner has opened
  const openTimes = openSlotsOf(salon);
  const morningSlots = MORNING_SLOTS.filter((x) => openTimes.includes(x));
  const afternoonSlots = AFTERNOON_SLOTS.filter((x) => openTimes.includes(x));

  // Listen to the slots already taken for this salon on the selected date
  useEffect(() => {
    setSelectedSlot(null);
    const q = query(
      collection(db, 'slots'),
      where('salonId', '==', salon.id),
      where('date', '==', selectedIso)
    );
    const unsub = onSnapshot(
      q,
      (snap) => setTakenSlots(snap.docs.map((d) => d.data().time)),
      (err) => console.log('Slots error', err)
    );
    return unsub;
  }, [salon.id, selectedIso]);

  // A slot is unavailable if it is taken, or already in the past today
  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const nowHHMM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const isUnavailable = (time) =>
    takenSlots.includes(time) || (selectedIso === days[0].iso && time <= nowHHMM);

  const handleConfirm = async () => {
    if (!selectedSlot || saving) return;
    const user = auth.currentUser;
    if (!user) {
      Alert.alert(t('login_again'));
      return;
    }

    setSaving(true);
    try {
      // The customer's name, saved inside the booking so the salon owner can see it
      const profileSnap = await getDoc(doc(db, 'users', user.uid));
      const customerName = profileSnap.exists() ? profileSnap.data().name || 'Customer' : 'Customer';

      const batch = writeBatch(db);

      // 1. The booking itself
      const bookingRef = doc(collection(db, 'bookings'));
      batch.set(bookingRef, {
        customerId: user.uid,
        customerName,
        salon: salon.name,
        service: service.name,
        when: `${selectedDay.fullLabel}, ${selectedSlot}`,
        createdAt: serverTimestamp(),
        // extra details for the owner side, reminders, cancel and reviews
        salonId: salon.id,
        salonOwnerId: salon.ownerId || null,
        serviceId: service.id,
        price: service.price,
        priceText: service.priceText || null,
        durationMin: service.durationMin,
        date: selectedDay.iso,
        time: selectedSlot,
        status: 'confirmed',
      });

      // 2. The "slot taken" marker. Its name = salon + date + time, so a second
      //    customer trying the same slot hits the SAME name and is refused.
      const slotRef = doc(db, 'slots', `${salon.id}_${selectedDay.iso}_${selectedSlot}`);
      batch.set(slotRef, {
        salonId: salon.id,
        date: selectedDay.iso,
        time: selectedSlot,
        customerId: user.uid,
        bookingId: bookingRef.id,
      });

      // Both saved together, or neither
      await batch.commit();

      navigation.navigate('Confirmation', {
        salon,
        service,
        slot: selectedSlot,
        date: { iso: selectedDay.iso, label: selectedDay.fullLabel },
      });
    } catch (e) {
      console.log('Booking error', e.code, e.message);
      if (e.code === 'permission-denied') {
        Alert.alert(t('slot_taken_title'), t('slot_taken_message'));
        setSelectedSlot(null);
      } else {
        Alert.alert(t('book_error_title'), e.message);
      }
    }
    setSaving(false);
  };

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={s.title}>{t('book_title')}</Text>
        <Text style={s.subtitle}>{t('book_subtitle')}</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="cut" size={20} color="#D85A30" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>{service.name}</Text>
            <Text style={s.cardSubtitle}>{salon.name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', maxWidth: '40%' }}>
            <Text style={styles.price}>{priceLabel}</Text>
            <Text style={styles.duration}>{t('duration_min', { n: service.durationMin })}</Text>
          </View>
        </View>

        <DaySelector days={days} selectedIso={selectedIso} onSelect={setSelectedIso} label={t('date_label')} />

        {morningSlots.length === 0 && afternoonSlots.length === 0 && (
          <Text style={s.subtitle}>{t('no_open_times')}</Text>
        )}
        {morningSlots.length > 0 && (
          <SlotGrid
            title={t('morning')}
            slots={morningSlots}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
            isUnavailable={isUnavailable}
          />
        )}
        {afternoonSlots.length > 0 && (
          <SlotGrid
            title={t('afternoon')}
            slots={afternoonSlots}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
            isUnavailable={isUnavailable}
          />
        )}

        <TouchableOpacity
          style={[s.button, (!selectedSlot || saving) && styles.buttonDisabled]}
          onPress={handleConfirm}
          disabled={!selectedSlot || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>
              {selectedSlot
                ? t('confirm_slot', { day: selectedDay.chipLabel, time: selectedSlot })
                : t('select_time')}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
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
    marginTop: 16,
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
    textAlign: 'right',
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
  slotTaken: {
    backgroundColor: '#F4F3EF',
    borderColor: '#eee',
  },
  slotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#fff',
  },
  slotTextTaken: {
    color: '#B5B3AC',
    textDecorationLine: 'line-through',
  },
  buttonDisabled: {
    backgroundColor: '#E8D9CE',
  },
});