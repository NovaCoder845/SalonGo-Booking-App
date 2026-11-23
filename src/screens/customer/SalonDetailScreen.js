import { Ionicons } from '@expo/vector-icons';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebaseConfig';
import s from '../../styles';

// "key" is used inside the code, "label" is the text key shown on screen
const TABS = [
  { key: 'Services', label: 'tab_services', icon: 'list-outline' },
  { key: 'Portfolio', label: 'tab_portfolio', icon: 'images-outline' },
  { key: 'Reviews', label: 'tab_reviews', icon: 'star-outline' },
];

function Stars({ rating, size = 14 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={size}
          color="#D85A30"
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
}

export default function SalonDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const [salon, setSalon] = useState(route.params.salon); // starts with the copy from the list
  const [activeTab, setActiveTab] = useState('Services');
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Always use the latest version of this salon straight from the database
  // (phone, address, open times, photo ...), not only the copy given by the list
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'salons', route.params.salon.id),
      (snap) => {
        if (snap.exists()) setSalon({ id: snap.id, ...snap.data() });
      },
      (err) => console.log('Salon error', err)
    );
    return unsub;
  }, [route.params.salon.id]);

  const hasLocation = salon.latitude != null && salon.longitude != null;
  const hasPhone = !!salon.phone && salon.phone.trim().length > 0;

  // Open Google Maps with directions to this salon (no API key needed)
  const openDirections = async () => {
    if (!hasLocation) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}&travelmode=driving`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.log('Open maps error', e);
      Alert.alert(t('maps_error_title'), t('maps_error_message'));
    }
  };

  // Open the phone's dialer with the salon's number
  const callSalon = async () => {
    if (!hasPhone) return;
    try {
      await Linking.openURL(`tel:${salon.phone.replace(/[^\d+]/g, '')}`);
    } catch (e) {
      console.log('Call error', e);
      Alert.alert(t('call_error_title', { defaultValue: 'Could not start the call' }), salon.phone);
    }
  };

  // Listen to this salon's services in Firestore
  useEffect(() => {
    const q = query(collection(db, 'services'), where('salonId', '==', salon.id));
    const unsub = onSnapshot(
      q,
      (snap) => setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.log('Services error', err)
    );
    return unsub;
  }, [salon.id]);

  // Listen to this salon's portfolio photos
  useEffect(() => {
    const q = query(collection(db, 'portfolio'), where('salonId', '==', salon.id));
    const unsub = onSnapshot(
      q,
      (snap) => setPortfolio(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.log('Portfolio error', err)
    );
    return unsub;
  }, [salon.id]);

  // Listen to this salon's reviews (newest first)
  useEffect(() => {
    const q = query(collection(db, 'reviews'), where('salonId', '==', salon.id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const time = (r) => r.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
        list.sort((a, b) => time(b) - time(a));
        setReviews(list);
      },
      (err) => console.log('Reviews error', err)
    );
    return unsub;
  }, [salon.id]);

  const average = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <View style={s.screen}>
      <View style={styles.header}>
        {salon.photo ? (
          <Image source={{ uri: salon.photo }} style={styles.salonPhoto} />
        ) : (
          <View style={styles.salonIcon}>
            <Ionicons name="cut" size={24} color="#D85A30" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{salon.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color="#888780" />
            <Text style={styles.metaText}>{salon.area}</Text>
            {reviews.length > 0 && (
              <>
                <Ionicons name="star" size={13} color="#D85A30" style={{ marginLeft: 10 }} />
                <Text style={styles.metaText}>
                  {average.toFixed(1)} ({reviews.length})
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Address and directions */}
      {(!!salon.address || hasLocation) && (
        <View style={styles.addressCard}>
          <Ionicons name="navigate-circle-outline" size={26} color="#534AB7" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>{t('address_label')}</Text>
            <Text style={styles.addressText}>{salon.address || salon.area}</Text>
          </View>
          {hasLocation && (
            <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
              <Ionicons name="map-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.directionsText}>{t('directions')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Phone number and call button */}
      {hasPhone && (
        <View style={[styles.addressCard, { marginTop: -6 }]}>
          <Ionicons name="call-outline" size={26} color="#1D9E75" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>{t('contact_label', { defaultValue: 'Phone' })}</Text>
            <Text style={styles.addressText}>{salon.phone}</Text>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={callSalon}>
            <Ionicons name="call" size={15} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.directionsText}>{t('call_salon', { defaultValue: 'Call' })}</Text>
          </TouchableOpacity>
        </View>
      )}

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
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{t(tab.label)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Services' && (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={s.subtitle}>{t('no_services')}</Text>}
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
                <Text style={s.cardSubtitle}>{t('duration_min', { n: item.durationMin })}</Text>
              </View>
              <Text style={styles.price}>{item.priceText || `Rs ${item.price}`}</Text>
              <Ionicons name="chevron-forward" size={18} color="#C9C7C0" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        />
      )}

      {activeTab === 'Portfolio' && (
        <FlatList
          data={portfolio}
          keyExtractor={(item) => item.id}
          numColumns={3}
          ListEmptyComponent={<Text style={s.subtitle}>{t('no_photos')}</Text>}
          renderItem={({ item }) => (
            <View style={styles.portfolioTile}>
              <Image source={{ uri: item.image }} style={styles.portfolioImage} />
            </View>
          )}
        />
      )}

      {activeTab === 'Reviews' && (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            reviews.length > 0 ? (
              <View style={styles.summary}>
                <Text style={styles.summaryValue}>{average.toFixed(1)}</Text>
                <View>
                  <Stars rating={Math.round(average)} size={18} />
                  <Text style={styles.summaryCount}>
                    {t(reviews.length === 1 ? 'reviews_one' : 'reviews_many', { n: reviews.length })}
                  </Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{(item.customerName || 'C').charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{item.customerName || t('customer')}</Text>
                  <Stars rating={item.rating} />
                </View>
              </View>
              {!!item.comment && <Text style={styles.reviewComment}>{item.comment}</Text>}
            </View>
          )}
          ListEmptyComponent={<Text style={s.subtitle}>{t('no_reviews')}</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  salonPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: '#F4F3EF',
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
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F5FD',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888780',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    color: '#2C3E50',
    fontWeight: '500',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#534AB7',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  directionsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
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
    maxWidth: '38%',
    textAlign: 'right',
  },
  portfolioTile: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 10,
    backgroundColor: '#F4F3EF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2C3E50',
  },
  summaryCount: {
    fontSize: 12,
    color: '#888780',
    marginTop: 3,
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