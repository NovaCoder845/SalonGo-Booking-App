import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import KeyboardScreen from '../../components/KeyboardScreen';
import { auth, db } from '../../firebaseConfig';
import s from '../../styles';
import { searchAddress } from '../../utils/addressSearch';

// English and French texts of this screen
const TEXTS = {
  en: {
    title: 'My salon',
    subtitle: 'Customers will find and book your salon from these details',
    salon_name: 'Salon name',
    salon_name_ph: 'e.g. Bella Coiffure',
    phone_label: 'Phone number (customers can call you)',
    phone_ph: 'e.g. 5712 3456',
    address_label: 'Address (start typing, then pick a suggestion)',
    address_ph: 'e.g. Royal Road, Curepipe',
    credit: 'Address data © OpenStreetMap contributors',
    no_suggestions: 'No suggestions found. Try another spelling, or tap "Use my location".',
    area_label: 'Area / town',
    area_ph: 'e.g. Curepipe',
    find_address: 'Find this address',
    use_my_location: 'Use my location',
    location_set: (lat, lng) => `Location set (${lat}, ${lng})`,
    location_not_set: 'Location not set yet',
    save_salon: 'Save salon',
    services: 'Services',
    add_a_service: 'Add a service',
    service_name_ph: 'Service name (e.g. Haircut)',
    minutes_ph: 'Minutes',
    price_ph: 'Price, e.g. From Rs 500',
    price_hint: 'You can write a range or a starting price: 500, From Rs 500, 500 - 900. It must contain a number.',
    add_service: 'Add service',
    your_services: 'Your services',
    no_services: 'No services yet. Add your first one above.',
    min: 'min',
    // alerts
    type_address_first: 'Type an address first',
    type_address_first_msg: 'For example: Royal Road, Curepipe',
    address_not_found: 'Address not found',
    address_not_found_msg: 'Try a simpler address, or use "Use my location".',
    could_not_find: 'Could not find this address',
    could_not_find_msg: 'Use "Use my location" instead.',
    location_not_allowed: 'Location not allowed',
    location_not_allowed_msg: 'Allow location in the phone settings to use this.',
    could_not_get_location: 'Could not get your location',
    missing_details: 'Missing details',
    missing_salon_msg: 'Please fill the salon name and area.',
    location_missing: 'Location missing',
    location_missing_msg: 'Pick an address suggestion, or tap "Use my location".',
    check_phone: 'Check the phone number',
    check_phone_msg: 'Use only numbers, for example: 5712 3456 or +230 5712 3456.',
    salon_saved: 'Salon saved',
    salon_saved_msg: 'Customers can now find your salon.',
    could_not_save: 'Could not save',
    save_first: 'Save your salon first',
    save_first_msg: 'Then you can add services.',
    missing_service_msg: 'Please fill the service name, duration (minutes) and price.',
    price_needs_number: 'Price needs a number',
    price_needs_number_msg: 'For example: 500, or From Rs 500, or 500 - 900.',
    could_not_add: 'Could not add service',
    remove_service: 'Remove service',
    remove_confirm: (name) => `Remove "${name}"?`,
    cancel: 'Cancel',
    remove: 'Remove',
  },
  fr: {
    title: 'Mon salon',
    subtitle: 'Les clients trouveront et réserveront votre salon grâce à ces informations',
    salon_name: 'Nom du salon',
    salon_name_ph: 'ex. Bella Coiffure',
    phone_label: 'Numéro de téléphone (les clients peuvent vous appeler)',
    phone_ph: 'ex. 5712 3456',
    address_label: 'Adresse (commencez à écrire, puis choisissez une suggestion)',
    address_ph: 'ex. Royal Road, Curepipe',
    credit: 'Données d’adresse © contributeurs OpenStreetMap',
    no_suggestions: 'Aucune suggestion. Essayez une autre orthographe, ou touchez « Ma position ».',
    area_label: 'Quartier / ville',
    area_ph: 'ex. Curepipe',
    find_address: 'Trouver cette adresse',
    use_my_location: 'Ma position',
    location_set: (lat, lng) => `Position définie (${lat}, ${lng})`,
    location_not_set: 'Position non définie',
    save_salon: 'Enregistrer le salon',
    services: 'Services',
    add_a_service: 'Ajouter un service',
    service_name_ph: 'Nom du service (ex. Coupe)',
    minutes_ph: 'Minutes',
    price_ph: 'Prix, ex. À partir de Rs 500',
    price_hint: 'Vous pouvez écrire une fourchette ou un prix de départ : 500, À partir de Rs 500, 500 - 900. Il doit contenir un chiffre.',
    add_service: 'Ajouter le service',
    your_services: 'Vos services',
    no_services: 'Aucun service. Ajoutez le premier ci-dessus.',
    min: 'min',
    // alerts
    type_address_first: "Saisissez d'abord une adresse",
    type_address_first_msg: 'Par exemple : Royal Road, Curepipe',
    address_not_found: 'Adresse introuvable',
    address_not_found_msg: 'Essayez une adresse plus simple, ou utilisez « Ma position ».',
    could_not_find: 'Impossible de trouver cette adresse',
    could_not_find_msg: 'Utilisez plutôt « Ma position ».',
    location_not_allowed: 'Localisation refusée',
    location_not_allowed_msg: 'Autorisez la localisation dans les réglages du téléphone.',
    could_not_get_location: "Impossible d'obtenir votre position",
    missing_details: 'Informations manquantes',
    missing_salon_msg: 'Veuillez remplir le nom du salon et le quartier.',
    location_missing: 'Position manquante',
    location_missing_msg: 'Choisissez une suggestion d’adresse, ou touchez « Ma position ».',
    check_phone: 'Vérifiez le numéro de téléphone',
    check_phone_msg: 'Utilisez uniquement des chiffres, par exemple : 5712 3456 ou +230 5712 3456.',
    salon_saved: 'Salon enregistré',
    salon_saved_msg: 'Les clients peuvent maintenant trouver votre salon.',
    could_not_save: "Enregistrement impossible",
    save_first: "Enregistrez d'abord votre salon",
    save_first_msg: 'Vous pourrez ensuite ajouter des services.',
    missing_service_msg: 'Veuillez remplir le nom du service, la durée (minutes) et le prix.',
    price_needs_number: 'Le prix doit contenir un chiffre',
    price_needs_number_msg: 'Par exemple : 500, ou À partir de Rs 500, ou 500 - 900.',
    could_not_add: "Impossible d'ajouter le service",
    remove_service: 'Supprimer le service',
    remove_confirm: (name) => `Supprimer « ${name} » ?`,
    cancel: 'Annuler',
    remove: 'Supprimer',
  },
};

export default function MySalonScreen() {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [salonSaved, setSalonSaved] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState(null); // { latitude, longitude }

  // Address suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchTimer = useRef(null);
  const searchCounter = useRef(0);

  const [services, setServices] = useState([]);
  const [svcName, setSvcName] = useState('');
  const [svcDuration, setSvcDuration] = useState('');
  const [svcPrice, setSvcPrice] = useState(''); // free text, e.g. "From Rs 500"

  // Load my salon (if I already created it)
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'salons', uid));
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name || '');
          setPhone(d.phone || '');
          setArea(d.area || '');
          setAddress(d.address || '');
          if (d.latitude != null && d.longitude != null) {
            setCoords({ latitude: d.latitude, longitude: d.longitude });
          }
          setSalonSaved(true);
        }
      } catch (e) {
        console.log('Load salon error', e);
      }
      setLoading(false);
    })();
  }, [uid]);

  // Listen to my services
  useEffect(() => {
    const q = query(collection(db, 'services'), where('salonId', '==', uid));
    const unsub = onSnapshot(
      q,
      (snap) => setServices(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.log('Services error', err)
    );
    return unsub;
  }, [uid]);

  // Stop any waiting search when leaving the screen
  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  // When the owner types in the Address box: wait a moment, then search
  const onAddressChange = (text) => {
    setAddress(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (text.trim().length < 3) {
      setSuggestions([]);
      setSearched(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const thisSearch = ++searchCounter.current;
      try {
        const results = await searchAddress(text);
        if (thisSearch !== searchCounter.current) return; // an older search, ignore it
        setSuggestions(results);
        setSearched(true);
      } catch (e) {
        console.log('Address search error', e);
        if (thisSearch !== searchCounter.current) return;
        setSuggestions([]);
        setSearched(true);
      }
      if (thisSearch === searchCounter.current) setSearching(false);
    }, 600);
  };

  // The owner taps a suggestion: fill address, area and map location
  const pickSuggestion = (item) => {
    searchCounter.current += 1; // cancel any search still running
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setAddress(item.address);
    if (item.area) setArea(item.area);
    setCoords({ latitude: item.latitude, longitude: item.longitude });
    setSuggestions([]);
    setSearched(false);
    setSearching(false);
    Keyboard.dismiss();
  };

  // Backup: turn the typed address into map coordinates
  const findAddress = async () => {
    if (!address.trim()) {
      Alert.alert(L.type_address_first, L.type_address_first_msg);
      return;
    }
    setLocating(true);
    try {
      const results = await Location.geocodeAsync(`${address.trim()}, Mauritius`);
      if (!results.length) {
        Alert.alert(L.address_not_found, L.address_not_found_msg);
      } else {
        setCoords({ latitude: results[0].latitude, longitude: results[0].longitude });
      }
    } catch (e) {
      console.log('Geocode error', e);
      Alert.alert(L.could_not_find, L.could_not_find_msg);
    }
    setLocating(false);
  };

  // Use the phone's GPS (owner standing inside the salon)
  const useMyLocation = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert(L.location_not_allowed, L.location_not_allowed_msg);
        setLocating(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCoords(c);

      // Try to fill the area and address automatically
      try {
        const [place] = await Location.reverseGeocodeAsync(c);
        if (place) {
          if (!area) setArea(place.city || place.district || place.subregion || '');
          if (!address) setAddress([place.street, place.city].filter(Boolean).join(', '));
        }
      } catch (e) {
        console.log('Reverse geocode error', e);
      }
    } catch (e) {
      console.log('Location error', e);
      Alert.alert(L.could_not_get_location, e.message);
    }
    setLocating(false);
  };

  const saveSalon = async () => {
    if (!name.trim() || !area.trim()) {
      Alert.alert(L.missing_details, L.missing_salon_msg);
      return;
    }
    if (!coords) {
      Alert.alert(L.location_missing, L.location_missing_msg);
      return;
    }
    // The phone number is optional, but if it is filled it must look like a real number
    const phoneClean = phone.trim();
    if (phoneClean) {
      const digits = phoneClean.replace(/\D/g, '');
      if (digits.length < 7 || !/^[+\d\s()-]+$/.test(phoneClean)) {
        Alert.alert(L.check_phone, L.check_phone_msg);
        return;
      }
    }
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'salons', uid),
        {
          name: name.trim(),
          phone: phoneClean,
          area: area.trim(),
          address: address.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          ownerId: uid,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setSalonSaved(true);
      Alert.alert(L.salon_saved, L.salon_saved_msg);
    } catch (e) {
      console.log('Save salon error', e);
      Alert.alert(L.could_not_save, e.message);
    }
    setSaving(false);
  };

  const addService = async () => {
    if (!salonSaved) {
      Alert.alert(L.save_first, L.save_first_msg);
      return;
    }
    const duration = Number(svcDuration);
    const priceText = svcPrice.trim();
    // The first number in the text (e.g. "From Rs 500" -> 500), kept for the rest of the app
    const match = priceText.replace(/,/g, '').match(/\d+(\.\d+)?/);
    const price = match ? Number(match[0]) : 0;

    if (!svcName.trim() || !duration || !priceText) {
      Alert.alert(L.missing_details, L.missing_service_msg);
      return;
    }
    if (!price) {
      Alert.alert(L.price_needs_number, L.price_needs_number_msg);
      return;
    }
    try {
      await addDoc(collection(db, 'services'), {
        salonId: uid,
        ownerId: uid,
        name: svcName.trim(),
        durationMin: duration,
        price,
        priceText,
      });
      setSvcName('');
      setSvcDuration('');
      setSvcPrice('');
    } catch (e) {
      console.log('Add service error', e);
      Alert.alert(L.could_not_add, e.message);
    }
  };

  const removeService = (service) => {
    Alert.alert(L.remove_service, L.remove_confirm(service.name), [
      { text: L.cancel, style: 'cancel' },
      {
        text: L.remove,
        style: 'destructive',
        onPress: () => deleteDoc(doc(db, 'services', service.id)).catch((e) => console.log(e)),
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.screen}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <KeyboardScreen>
        <Text style={s.title}>{L.title}</Text>
        <Text style={s.subtitle}>{L.subtitle}</Text>

        <Text style={styles.label}>{L.salon_name}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={L.salon_name_ph} />

        <Text style={styles.label}>{L.phone_label}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder={L.phone_ph}
          keyboardType="phone-pad"
          maxLength={20}
        />

        <Text style={styles.label}>{L.address_label}</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={onAddressChange}
          placeholder={L.address_ph}
        />

        {searching && <ActivityIndicator size="small" style={{ marginVertical: 6 }} />}

        {suggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {suggestions.map((item) => (
              <TouchableOpacity key={item.id} style={styles.suggestionRow} onPress={() => pickSuggestion(item)}>
                <Ionicons name="location-outline" size={18} color="#534AB7" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionTitle}>{item.title}</Text>
                  {!!item.subtitle && <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>}
                </View>
              </TouchableOpacity>
            ))}
            <Text style={styles.credit}>{L.credit}</Text>
          </View>
        )}

        {searched && !searching && suggestions.length === 0 && (
          <Text style={styles.noResults}>{L.no_suggestions}</Text>
        )}

        <Text style={styles.label}>{L.area_label}</Text>
        <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder={L.area_ph} />

        <View style={styles.locationRow}>
          <TouchableOpacity style={styles.outlineButton} onPress={findAddress} disabled={locating}>
            <Ionicons name="search-outline" size={16} color="#534AB7" style={{ marginRight: 6 }} />
            <Text style={styles.outlineText}>{L.find_address}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={useMyLocation} disabled={locating}>
            <Ionicons name="locate-outline" size={16} color="#534AB7" style={{ marginRight: 6 }} />
            <Text style={styles.outlineText}>{L.use_my_location}</Text>
          </TouchableOpacity>
        </View>

        {locating && <ActivityIndicator style={{ marginBottom: 8 }} />}

        <View style={styles.coordsBox}>
          <Ionicons
            name={coords ? 'checkmark-circle' : 'ellipse-outline'}
            size={18}
            color={coords ? '#1D9E75' : '#C9C7C0'}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.coordsText}>
            {coords
              ? L.location_set(coords.latitude.toFixed(4), coords.longitude.toFixed(4))
              : L.location_not_set}
          </Text>
        </View>

        <TouchableOpacity style={[s.button, saving && { opacity: 0.6 }]} onPress={saveSalon} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>{L.save_salon}</Text>}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>{L.services}</Text>

        {/* Add a service: ABOVE the list, so it is never hidden by the keyboard */}
        <Text style={styles.label}>{L.add_a_service}</Text>
        <TextInput style={styles.input} value={svcName} onChangeText={setSvcName} placeholder={L.service_name_ph} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={svcDuration}
            onChangeText={setSvcDuration}
            placeholder={L.minutes_ph}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, { flex: 2 }]}
            value={svcPrice}
            onChangeText={setSvcPrice}
            placeholder={L.price_ph}
          />
        </View>
        <Text style={styles.priceHint}>{L.price_hint}</Text>
        <TouchableOpacity style={styles.addButton} onPress={addService}>
          <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={s.buttonText}>{L.add_service}</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 20 }]}>{L.your_services}</Text>
        {services.length === 0 && <Text style={s.subtitle}>{L.no_services}</Text>}
        {services.map((item) => (
          <View key={item.id} style={styles.serviceRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.name}</Text>
              <Text style={s.cardSubtitle}>
                {item.durationMin} {L.min} · {item.priceText || `Rs ${item.price}`}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeService(item)}>
              <Ionicons name="trash-outline" size={20} color="#C0392B" />
            </TouchableOpacity>
          </View>
        ))}
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888780',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  priceHint: {
    fontSize: 12,
    color: '#888780',
    marginTop: 2,
  },
  suggestionBox: {
    borderWidth: 1,
    borderColor: '#E4E1F5',
    borderRadius: 12,
    backgroundColor: '#FAF9FE',
    marginTop: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEBFA',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  suggestionSubtitle: {
    fontSize: 12,
    color: '#888780',
    marginTop: 2,
  },
  credit: {
    fontSize: 10,
    color: '#A8A6A0',
    textAlign: 'right',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  noResults: {
    fontSize: 12,
    color: '#888780',
    marginTop: 4,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#534AB7',
    borderRadius: 10,
    paddingVertical: 11,
  },
  outlineText: {
    color: '#534AB7',
    fontWeight: '600',
    fontSize: 13,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F3EF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  coordsText: {
    fontSize: 13,
    color: '#555',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#534AB7',
    borderRadius: 10,
    paddingVertical: 13,
    marginTop: 10,
  },
});