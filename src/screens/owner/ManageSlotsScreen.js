import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import s from '../../styles';
import { AFTERNOON_SLOTS, ALL_SLOTS, MORNING_SLOTS, openSlotsOf } from '../../utils/slots';

// English and French texts of this screen
const TEXTS = {
  en: {
    title: 'Manage slots',
    save_salon_first: 'Save your salon first (Profile → My salon). Then you can choose your open times here.',
    subtitle: 'These times apply to every day. Tap a time to open or close it, then press Save.',
    open_for_booking: 'Open for booking',
    closed: 'Closed',
    open_all: 'Open all',
    close_all: 'Close all',
    count: (open, total) => `${open} of ${total} open`,
    morning: 'Morning',
    afternoon: 'Afternoon',
    save_times: 'Save open times',
    saved_button: 'Saved',
    saved_title: 'Saved',
    saved_message: 'Customers will now see these times for your salon.',
    could_not_save: 'Could not save',
  },
  fr: {
    title: 'Gérer les créneaux',
    save_salon_first:
      "Enregistrez d'abord votre salon (Profil → Mon salon). Vous pourrez ensuite choisir vos horaires ici.",
    subtitle: 'Ces horaires valent pour tous les jours. Touchez une heure pour l’ouvrir ou la fermer, puis appuyez sur Enregistrer.',
    open_for_booking: 'Ouvert à la réservation',
    closed: 'Fermé',
    open_all: 'Tout ouvrir',
    close_all: 'Tout fermer',
    count: (open, total) => `${open} sur ${total} ouverts`,
    morning: 'Matin',
    afternoon: 'Après-midi',
    save_times: 'Enregistrer les horaires',
    saved_button: 'Enregistré',
    saved_title: 'Enregistré',
    saved_message: 'Les clients verront maintenant ces horaires pour votre salon.',
    could_not_save: "Enregistrement impossible",
  },
};

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
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const uid = auth.currentUser?.uid;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salonExists, setSalonExists] = useState(true);
  const [open, setOpen] = useState(new Set(ALL_SLOTS));
  const [changed, setChanged] = useState(false);

  // Load the times this salon has already chosen
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'salons', uid));
        if (snap.exists()) {
          setOpen(new Set(openSlotsOf(snap.data())));
        } else {
          setSalonExists(false);
        }
      } catch (e) {
        console.log('Load slots error', e);
      }
      setLoading(false);
    })();
  }, [uid]);

  const toggle = (slot) => {
    const next = new Set(open);
    next.has(slot) ? next.delete(slot) : next.add(slot);
    setOpen(next);
    setChanged(true);
  };

  const openAll = () => {
    setOpen(new Set(ALL_SLOTS));
    setChanged(true);
  };

  const closeAll = () => {
    setOpen(new Set());
    setChanged(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      // Keep the times in clock order
      const openSlots = ALL_SLOTS.filter((t) => open.has(t));
      await updateDoc(doc(db, 'salons', uid), { openSlots });
      setChanged(false);
      Alert.alert(L.saved_title, L.saved_message);
    } catch (e) {
      console.log('Save slots error', e);
      Alert.alert(L.could_not_save, e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <View style={s.screen}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!salonExists) {
    return (
      <View style={s.screen}>
        <Text style={s.title}>{L.title}</Text>
        <Text style={s.subtitle}>{L.save_salon_first}</Text>
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <Text style={s.title}>{L.title}</Text>
        <Text style={s.subtitle}>{L.subtitle}</Text>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Ionicons name="checkmark-circle" size={14} color="#1D9E75" />
            <Text style={styles.legendText}>{L.open_for_booking}</Text>
          </View>
          <View style={styles.legendItem}>
            <Ionicons name="close-circle-outline" size={14} color="#B9B6AE" />
            <Text style={styles.legendText}>{L.closed}</Text>
          </View>
        </View>

        <View style={styles.bulkRow}>
          <TouchableOpacity style={styles.bulkButton} onPress={openAll}>
            <Text style={styles.bulkText}>{L.open_all}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bulkButton} onPress={closeAll}>
            <Text style={styles.bulkText}>{L.close_all}</Text>
          </TouchableOpacity>
          <Text style={styles.count}>{L.count(open.size, ALL_SLOTS.length)}</Text>
        </View>

        <SlotSection title={L.morning} slots={MORNING_SLOTS} open={open} onToggle={toggle} />
        <SlotSection title={L.afternoon} slots={AFTERNOON_SLOTS} open={open} onToggle={toggle} />

        <TouchableOpacity
          style={[s.button, (!changed || saving) && { opacity: 0.5 }]}
          onPress={save}
          disabled={!changed || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>{changed ? L.save_times : L.saved_button}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    marginBottom: 16,
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
  bulkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  bulkButton: {
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bulkText: {
    color: '#534AB7',
    fontWeight: '600',
    fontSize: 13,
  },
  count: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    color: '#888780',
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
    paddingHorizontal: 14,
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