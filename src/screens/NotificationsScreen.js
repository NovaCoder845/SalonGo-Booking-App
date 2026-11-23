import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { getRemindersEnabled, setRemindersEnabled } from '../utils/reminders';

const TEXTS = {
  en: {
    title: 'Notifications',
    reminders: 'Booking reminders',
    reminders_desc: 'A notification 1 day and 1 hour before each appointment you book',
    on_note: 'Reminders are on. They apply to appointments you book from now on.',
    off_note: 'Reminders are off. The ones already scheduled were removed.',
    allowed: 'Your phone allows SalonGo notifications.',
    blocked: 'Your phone is blocking SalonGo notifications, so reminders cannot appear.',
    open_settings: 'Open phone settings',
  },
  fr: {
    title: 'Notifications',
    reminders: 'Rappels de réservation',
    reminders_desc: 'Une notification 1 jour et 1 heure avant chaque rendez-vous que vous réservez',
    on_note: 'Les rappels sont activés. Ils s’appliquent aux rendez-vous que vous réservez à partir de maintenant.',
    off_note: 'Les rappels sont désactivés. Ceux déjà programmés ont été supprimés.',
    allowed: 'Votre téléphone autorise les notifications de SalonGo.',
    blocked: 'Votre téléphone bloque les notifications de SalonGo, les rappels ne peuvent donc pas s’afficher.',
    open_settings: 'Ouvrir les réglages du téléphone',
  },
};

export default function NotificationsScreen({ navigation }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const [enabled, setEnabled] = useState(true);
  const [permission, setPermission] = useState('undetermined'); // granted / denied / undetermined

  // Read the saved choice, and re-check the phone's permission each time the screen opens
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const on = await getRemindersEnabled();
      const { status } = await Notifications.getPermissionsAsync();
      if (alive) {
        setEnabled(on);
        setPermission(status);
      }
    };
    refresh();
    const unsubscribe = navigation.addListener('focus', refresh);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [navigation]);

  const toggle = async (value) => {
    setEnabled(value);
    await setRemindersEnabled(value);
  };

  const allowed = permission === 'granted';

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#2C3E50" />
      </TouchableOpacity>
      <Text style={styles.title}>{L.title}</Text>

      <View style={styles.group}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{L.reminders}</Text>
            <Text style={styles.rowDesc}>{L.reminders_desc}</Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={toggle}
            trackColor={{ false: '#E5E2DC', true: '#D85A30' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <Text style={styles.note}>{enabled ? L.on_note : L.off_note}</Text>

      <View style={[styles.statusBox, allowed ? styles.statusOk : styles.statusWarn]}>
        <Ionicons
          name={allowed ? 'checkmark-circle' : 'alert-circle'}
          size={20}
          color={allowed ? '#1D9E75' : '#C0392B'}
          style={{ marginRight: 10 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.statusText}>{allowed ? L.allowed : L.blocked}</Text>
          {!allowed && (
            <TouchableOpacity onPress={() => Linking.openSettings()}>
              <Text style={styles.settingsLink}>{L.open_settings}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  back: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C3E50', marginBottom: 20 },
  group: { backgroundColor: '#FFF8F3', borderRadius: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 14 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  rowDesc: { fontSize: 13, color: '#888780', marginTop: 2, paddingRight: 10 },
  note: { fontSize: 12, color: '#888780', marginTop: 10, marginBottom: 20, paddingHorizontal: 4 },
  statusBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14 },
  statusOk: { backgroundColor: '#E9F6F1' },
  statusWarn: { backgroundColor: '#FBECEA' },
  statusText: { fontSize: 13, color: '#2C3E50' },
  settingsLink: { fontSize: 13, color: '#534AB7', fontWeight: '700', marginTop: 6 },
});