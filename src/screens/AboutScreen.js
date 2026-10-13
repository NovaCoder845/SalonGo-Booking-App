import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AboutScreen({ navigation }) {
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
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      <Text style={styles.description}>
        SalonGo makes it easy to find salons nearby, book appointments in a few taps, and keep track of every visit —
        and for salon owners, to manage services and slots from one place.
      </Text>

      <Text style={styles.footer}>Built as a solo mobile development project.</Text>
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
  description: { fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  footer: { fontSize: 12, color: '#C9C7C0', textAlign: 'center' },
});