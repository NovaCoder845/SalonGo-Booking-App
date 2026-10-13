import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../styles';

// Asks for location + notification permissions once, right after login.
// Camera permission is asked separately, only when someone actually
// tries to take/upload a photo (that's the right pattern — ask when needed).
export default function PermissionsScreen({ onDone }) {
  const [requesting, setRequesting] = useState(false);

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const locationResult = await Location.requestForegroundPermissionsAsync();
      const notifResult = await Notifications.requestPermissionsAsync();

      if (locationResult.status !== 'granted') {
        Alert.alert('Location not granted', 'You can still browse salons, but nearby sorting needs location access.');
      }
      if (notifResult.status !== 'granted') {
        Alert.alert('Notifications not granted', "You can still book appointments, but you won't get reminders.");
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

      <Text style={s.title}>Allow SalonGo to help you better</Text>
      <Text style={s.subtitle}>
        We use your location to show salons near you, and notifications to remind you about upcoming appointments.
      </Text>

      <View style={styles.reasonList}>
        <View style={styles.reasonRow}>
          <Ionicons name="location-outline" size={18} color="#D85A30" style={styles.reasonIcon} />
          <Text style={styles.reasonText}>Location — sorts and shows salons near you</Text>
        </View>
        <View style={styles.reasonRow}>
          <Ionicons name="notifications-outline" size={18} color="#534AB7" style={styles.reasonIcon} />
          <Text style={styles.reasonText}>Notifications — reminds you before an appointment</Text>
        </View>
      </View>

      <TouchableOpacity style={s.button} onPress={handleAllow} disabled={requesting}>
        <Text style={s.buttonText}>{requesting ? 'Requesting...' : 'Continue'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onDone}>
        <Text style={s.linkText}>Skip for now</Text>
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