import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const INITIAL = [
  { key: 'reminders', label: 'Booking reminders', description: 'Get notified before your upcoming appointments', value: true },
  { key: 'promotions', label: 'Promotions & offers', description: 'Deals from salons you follow', value: false },
  { key: 'messages', label: 'New messages', description: 'When a salon replies to you', value: true },
];

export default function NotificationsScreen({ navigation }) {
  const [settings, setSettings] = useState(INITIAL);

  const toggle = (key) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value: !s.value } : s)));
  };

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#2C3E50" />
      </TouchableOpacity>
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.group}>
        {settings.map((s, i) => (
          <View key={s.key} style={[styles.row, i < settings.length - 1 && styles.rowDivider]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>{s.label}</Text>
              <Text style={styles.rowDesc}>{s.description}</Text>
            </View>
            <Switch
              value={s.value}
              onValueChange={() => toggle(s.key)}
              trackColor={{ false: '#E5E2DC', true: '#D85A30' }}
              thumbColor="#fff"
            />
          </View>
        ))}
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
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F1EEE8' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  rowDesc: { fontSize: 13, color: '#888780', marginTop: 2 },
});