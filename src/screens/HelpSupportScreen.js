import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const FAQS = [
  { q: 'How do I book an appointment?', a: 'Open a salon from the Home tab, pick a service and an open time slot, then confirm — you’ll get a confirmation and a reminder before your visit.' },
  { q: 'Can I cancel or reschedule?', a: 'Go to Appointments, open the booking, and choose Cancel or Reschedule. Changes made close to the appointment time may not always be possible.' },
  { q: 'How do salon owners manage slots?', a: 'Owners can open their dashboard from the Home tab and add, edit, or block out time slots for their salon.' },
];

export default function HelpSupportScreen({ navigation }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#2C3E50" />
      </TouchableOpacity>
      <Text style={styles.title}>Help & support</Text>

      <Text style={styles.sectionLabel}>Frequently asked</Text>
      <View style={styles.group}>
        {FAQS.map((item, i) => (
          <View key={item.q} style={[styles.faqItem, i < FAQS.length - 1 && styles.rowDivider]}>
            <TouchableOpacity style={styles.faqHeader} onPress={() => setOpenIndex(openIndex === i ? null : i)}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Ionicons name={openIndex === i ? 'chevron-up' : 'chevron-down'} size={18} color="#888780" />
            </TouchableOpacity>
            {openIndex === i && <Text style={styles.faqA}>{item.a}</Text>}
          </View>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Still need help?</Text>
      <View style={styles.group}>
        <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@salongo.app')}>
          <Ionicons name="mail-outline" size={18} color="#3B6FB5" style={{ marginRight: 10 }} />
          <Text style={styles.contactText}>support@salongo.app</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  back: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C3E50', marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888780', marginBottom: 10, marginTop: 8 },
  group: { backgroundColor: '#FFF8F3', borderRadius: 16, marginBottom: 20 },
  faqItem: { padding: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#F1EEE8' },
  faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '600', color: '#2C3E50', marginRight: 10 },
  faqA: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  contactText: { fontSize: 15, color: '#2C3E50', fontWeight: '500' },
});