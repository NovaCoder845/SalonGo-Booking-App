import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../../styles';

// Later: replace with Firestore queries for this salon's services,
// portfolio photos (Firebase Storage) and reviews.
const PLACEHOLDER_SERVICES = [
  { id: 's1', name: 'Haircut', durationMin: 30, price: 500 },
  { id: 's2', name: 'Manicure', durationMin: 45, price: 700 },
  { id: 's3', name: 'Makeup', durationMin: 60, price: 1500 },
];

const PLACEHOLDER_PORTFOLIO = [
  { id: 'p1' }, { id: 'p2' }, { id: 'p3' },
  { id: 'p4' }, { id: 'p5' }, { id: 'p6' },
];

const PLACEHOLDER_REVIEWS = [
  { id: 'r1', name: 'Priya N.', rating: 5, comment: 'Great service, very friendly staff.' },
  { id: 'r2', name: 'Jordan L.', rating: 4, comment: 'Good haircut, a bit of a wait.' },
];

const TABS = [
  { key: 'Services', icon: 'list-outline' },
  { key: 'Portfolio', icon: 'images-outline' },
  { key: 'Reviews', icon: 'star-outline' },
];

function Stars({ rating }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={14}
          color="#D85A30"
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

export default function SalonDetailScreen({ route, navigation }) {
  const { salon } = route.params;
  const [activeTab, setActiveTab] = useState('Services');

  return (
    <View style={s.screen}>
      <View style={styles.header}>
        <View style={styles.salonIcon}>
          <Ionicons name="cut" size={24} color="#D85A30" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{salon.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color="#888780" />
            <Text style={styles.metaText}>{salon.area}</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tabPill, activeTab === tab.key && styles.tabPillActive]}
          >
            <Ionicons
              name={tab.icon}
              size={15}
              color={activeTab === tab.key ? '#fff' : '#555'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.key}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Services' && (
        <FlatList
          data={PLACEHOLDER_SERVICES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => navigation.navigate('Booking', { salon, service: item })}
            >
              <View style={styles.serviceIcon}>
                <Ionicons name="cut-outline" size={18} color="#534AB7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.name}</Text>
                <Text style={s.cardSubtitle}>{item.durationMin} min</Text>
              </View>
              <Text style={styles.price}>Rs {item.price}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C9C7C0" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        />
      )}

      {activeTab === 'Portfolio' && (
        <FlatList
          data={PLACEHOLDER_PORTFOLIO}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={() => (
            <View style={styles.portfolioTile}>
              <Ionicons name="image-outline" size={22} color="#C9C7C0" />
            </View>
          )}
        />
      )}

      {activeTab === 'Reviews' && (
        <FlatList
          data={PLACEHOLDER_REVIEWS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{item.name}</Text>
                  <Stars rating={item.rating} />
                </View>
              </View>
              <Text style={styles.reviewComment}>{item.comment}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={s.subtitle}>No reviews yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  salonIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FBEAE2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 13,
    color: '#888780',
    marginLeft: 4,
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  tabPillActive: {
    backgroundColor: '#D85A30',
  },
  tabText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#fff',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFEDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D85A30',
  },
  portfolioTile: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 10,
    backgroundColor: '#F4F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#534AB7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  reviewComment: {
    fontSize: 13,
    color: '#555',
    lineHeight: 19,
  },
});