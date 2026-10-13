import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import s from '../../styles';

// Later: replace this array with a Firestore query on the "salons"
// collection, sorted by distance using the phone's GPS location.
const PLACEHOLDER_SALONS = [
  { id: '1', name: 'Bella Coiffure', area: 'Flic en Flac', distanceKm: 1.2 },
  { id: '2', name: 'Glow Studio', area: 'Quatre Bornes', distanceKm: 8.4 },
  { id: '3', name: 'Urban Cuts', area: 'Curepipe', distanceKm: 12.1 },
];

export default function SalonListScreen({ navigation }) {
  const [query, setQuery] = useState('');

  const filtered = PLACEHOLDER_SALONS.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.area.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <View style={s.screen}>
      <Text style={s.title}>Salons near you</Text>
      <Text style={s.subtitle}>Sorted by distance from your location</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#888780" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by salon or area"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={32} color="#C9C7C0" />
            <Text style={styles.emptyText}>No salons match "{query}"</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.salonCard}
            onPress={() => navigation.navigate('SalonDetail', { salon: item })}
          >
            <View style={styles.salonIcon}>
              <Ionicons name="cut" size={20} color="#D85A30" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={13} color="#888780" />
                <Text style={styles.metaText}>
                  {item.area} · {item.distanceKm} km away
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#C9C7C0" />
          </TouchableOpacity>
        )}
      />
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