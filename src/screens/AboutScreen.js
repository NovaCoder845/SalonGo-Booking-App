import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TEXTS = {
  en: {
    version: 'Version 1.0.0',
    d1: 'SalonGo helps you find salons near you, book an appointment in a few taps, get a reminder before your visit, and review the salon afterwards.',
    d2: 'Salon owners can present their salon, list their services and prices, set their open times, show photos of their work, and follow their bookings from one place.',
    credit: 'Address search and location data © OpenStreetMap contributors',
  },
  fr: {
    version: 'Version 1.0.0',
    d1: 'SalonGo vous aide à trouver des salons près de chez vous, à réserver un rendez-vous en quelques touches, à recevoir un rappel avant votre visite, puis à donner votre avis sur le salon.',
    d2: 'Les propriétaires de salon peuvent présenter leur salon, lister leurs services et leurs prix, définir leurs horaires, montrer des photos de leur travail et suivre leurs réservations au même endroit.',
    credit: 'Recherche d’adresses et données de localisation © contributeurs OpenStreetMap',
  },
};

export default function AboutScreen({ navigation }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#2C3E50" />
      </TouchableOpacity>

      <View style={styles.logoWrap}>
        <View style={styles.logoCircle}>
          <Ionicons name="cut" size={32} color="#fff" />
        </View>
        <Text style={styles.appName}>SalonGo</Text>
        <Text style={styles.version}>{L.version}</Text>
      </View>

      <Text style={styles.description}>{L.d1}</Text>
      <Text style={styles.description}>{L.d2}</Text>

      <Text style={styles.credit}>{L.credit}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  back: { marginBottom: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D85A30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appName: { fontSize: 20, fontWeight: '700', color: '#2C3E50' },
  version: { fontSize: 13, color: '#888780', marginTop: 2 },
  description: { fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  credit: { fontSize: 12, color: '#888780', textAlign: 'center', marginTop: 8 },
});