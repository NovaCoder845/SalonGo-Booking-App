import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import s from '../../styles';

// English and French texts of this screen
const TEXTS = {
  en: {
    title: 'Salons near you',
    sorted: 'Sorted by distance from your location',
    location_off: 'Turn on location to sort by distance',
    search_ph: 'Search by salon or area',
    no_salons: 'No salons yet',
    no_match: (q) => `No salons match "${q}"`,
    away: (km) => ` · ${km} km away`,
  },
  fr: {
    title: 'Salons près de vous',
    sorted: 'Triés par distance depuis votre position',
    location_off: 'Activez la localisation pour trier par distance',
    search_ph: 'Rechercher un salon ou un quartier',
    no_salons: 'Aucun salon pour le moment',
    no_match: (q) => `Aucun salon ne correspond à « ${q} »`,
    away: (km) => ` · à ${km} km`,
  },
};

// Distance between two GPS points, in km (Haversine formula)
function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371; // radius of the Earth in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function SalonListScreen({ navigation }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const [query, setQuery] = useState('');
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState(null); // { latitude, longitude } or null

  // 1. Listen to the "salons" collection in Firestore
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'salons'),
      (snap) => {
        setSalons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.log('Salons error', err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // 2. Get the customer's position (only if permission was granted)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let pos = await Location.getLastKnownPositionAsync();
        if (!pos) pos = await Location.getCurrentPositionAsync({});
        setUserPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      } catch (e) {
        console.log('Location error', e);
      }
    })();
  }, []);

  // 3. Add the distance to each salon, then sort nearest first
  const sorted = useMemo(() => {
    const withDistance = salons.map((salon) => ({
      ...salon,
      distanceKm:
        userPos && salon.latitude != null && salon.longitude != null
          ? Math.round(distanceKm(userPos.latitude, userPos.longitude, salon.latitude, salon.longitude) * 10) / 10
          : null,
    }));
    return withDistance.sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return (a.name || '').localeCompare(b.name || '');
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  }, [salons, userPos]);

  const filtered = sorted.filter(
    (salon) =>
      (salon.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (salon.area || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={s.screen}>
      <Text style={s.title}>{L.title}</Text>
      <Text style={s.subtitle}>{userPos ? L.sorted : L.location_off}</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#888780" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={L.search_ph}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={32} color="#C9C7C0" />
              <Text style={styles.emptyText}>{salons.length === 0 ? L.no_salons : L.no_match(query)}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.salonCard}
              onPress={() => navigation.navigate('SalonDetail', { salon: item })}
            >
              {item.photo ? (
                <Image source={{ uri: item.photo }} style={styles.salonPhoto} />
              ) : (
                <View style={styles.salonIcon}>
                  <Ionicons name="cut" size={20} color="#D85A30" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color="#888780" />
                  <Text style={styles.metaText}>
                    {item.area}
                    {item.distanceKm != null ? L.away(item.distanceKm) : ''}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C9C7C0" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3EF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  salonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  salonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FBEAE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  salonPhoto: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: '#F4F3EF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  metaText: {
    fontSize: 13,
    color: '#888780',
    marginLeft: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888780',
    fontSize: 14,
    marginTop: 10,
  },
});