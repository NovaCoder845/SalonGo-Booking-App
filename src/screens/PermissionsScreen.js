import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../styles';

const TEXTS = {
  en: {
    title: 'Allow SalonGo to help you better',
    subtitle:
      'We use your location to show salons near you, and notifications to remind you about upcoming appointments.',
    location_reason: 'Location — sorts and shows salons near you',
    notif_reason: 'Notifications — reminds you before an appointment',
    continue: 'Continue',
    requesting: 'Requesting...',
    skip: 'Skip for now',
    loc_denied: 'Location not granted',
    loc_denied_msg: 'You can still browse salons, but nearby sorting needs location access.',
    notif_denied: 'Notifications not granted',
    notif_denied_msg: "You can still book appointments, but you won't get reminders.",
  },
  fr: {
    title: 'Autorisez SalonGo à mieux vous aider',
    subtitle:
      'Nous utilisons votre position pour afficher les salons près de vous, et les notifications pour vous rappeler vos prochains rendez-vous.',
    location_reason: 'Localisation — trie et affiche les salons près de vous',
    notif_reason: 'Notifications — vous rappelle avant un rendez-vous',
    continue: 'Continuer',
    requesting: 'Demande en cours...',
    skip: 'Passer pour le moment',
    loc_denied: 'Localisation non autorisée',
    loc_denied_msg: 'Vous pouvez toujours parcourir les salons, mais le tri par proximité nécessite la localisation.',
    notif_denied: 'Notifications non autorisées',
    notif_denied_msg: 'Vous pouvez toujours réserver, mais vous ne recevrez pas de rappels.',
  },
};

// Asks for location + notification permissions once, right after login.
// Camera permission is asked separately, only when someone actually
// tries to take/upload a photo (that's the right pattern — ask when needed).
export default function PermissionsScreen({ onDone }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const locationResult = await Location.requestForegroundPermissionsAsync();
      const notifResult = await Notifications.requestPermissionsAsync();

      if (locationResult.status !== 'granted') {
        Alert.alert(L.loc_denied, L.loc_denied_msg);
      }
      if (notifResult.status !== 'granted') {
        Alert.alert(L.notif_denied, L.notif_denied_msg);
      }
    } catch (e) {
      console.log('Permission request error', e);
    }
    setRequesting(false);
    onDone();
  };

  return (
    <View style={s.screen}>
      <LinearGradient
        colors={['#D85A30', '#A6499B', '#534AB7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="location" size={28} color="#D85A30" />
          </View>
          <View style={styles.badge}>
            <Ionicons name="notifications" size={28} color="#534AB7" />
          </View>
        </View>
      </LinearGradient>

      <Text style={s.title}>{L.title}</Text>
      <Text style={s.subtitle}>{L.subtitle}</Text>

      <View style={styles.reasonList}>
        <View style={styles.reasonRow}>
          <Ionicons name="location-outline" size={18} color="#D85A30" style={styles.reasonIcon} />
          <Text style={styles.reasonText}>{L.location_reason}</Text>
        </View>
        <View style={styles.reasonRow}>
          <Ionicons name="notifications-outline" size={18} color="#534AB7" style={styles.reasonIcon} />
          <Text style={styles.reasonText}>{L.notif_reason}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.button} onPress={handleAllow} disabled={requesting}>
        <Text style={s.buttonText}>{requesting ? L.requesting : L.continue}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDone}>
        <Text style={s.linkText}>{L.skip}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 140,
    borderRadius: 24,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonList: {
    marginTop: 4,
    marginBottom: 28,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reasonIcon: {
    marginRight: 10,
  },
  reasonText: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
});