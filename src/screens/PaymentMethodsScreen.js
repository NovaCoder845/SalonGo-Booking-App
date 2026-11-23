import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TEXTS = {
  en: {
    title: 'Payment methods',
    pay_title: 'Pay at the salon',
    pay_text:
      'You pay directly at the salon after your appointment. The price of each service is shown before you book, so there are no surprises.',
    soon_title: 'Online payment: coming soon',
    soon_text:
      'Paying by card inside the app is planned for a future version. No card details are collected or stored today.',
  },
  fr: {
    title: 'Moyens de paiement',
    pay_title: 'Payer au salon',
    pay_text:
      "Vous payez directement au salon après votre rendez-vous. Le prix de chaque service est affiché avant la réservation, il n'y a donc pas de surprise.",
    soon_title: 'Paiement en ligne : bientôt disponible',
    soon_text:
      "Le paiement par carte dans l'application est prévu pour une prochaine version. Aucune donnée de carte n'est collectée ni stockée aujourd'hui.",
  },
};

export default function PaymentMethodsScreen({ navigation }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#2C3E50" />
      </TouchableOpacity>
      <Text style={styles.title}>{L.title}</Text>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="cash-outline" size={28} color="#1D9E75" />
        </View>
        <Text style={styles.cardTitle}>{L.pay_title}</Text>
        <Text style={styles.cardText}>{L.pay_text}</Text>
      </View>

      <View style={styles.soon}>
        <Ionicons name="card-outline" size={20} color="#888780" style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.soonTitle}>{L.soon_title}</Text>
          <Text style={styles.soonText}>{L.soon_text}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  back: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C3E50', marginBottom: 20 },
  card: { backgroundColor: '#E9F6F1', borderRadius: 16, padding: 20, alignItems: 'center' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#2C3E50', marginBottom: 6 },
  cardText: { fontSize: 14, color: '#2C3E50', textAlign: 'center', lineHeight: 20 },
  soon: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F4F0',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  soonTitle: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  soonText: { fontSize: 13, color: '#888780', marginTop: 2, lineHeight: 18 },
});