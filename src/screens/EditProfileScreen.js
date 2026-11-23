import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import KeyboardScreen from '../components/KeyboardScreen';
import { auth, db } from '../firebaseConfig';
import { toSmallImageText } from '../utils/imageUtils';

// English and French texts of this screen
const TEXTS = {
  en: {
    title: 'Edit profile',
    photo_hint: 'Tap to change photo, then press "Save changes"',
    basic_info: 'Basic info',
    name: 'Name',
    name_ph: 'Your name',
    email: 'Email (used to log in)',
    phone: 'Phone number',
    age: 'Age',
    age_ph: 'e.g. 24',
    gender: 'Gender',
    female: 'Female',
    male: 'Male',
    address: 'Address',
    address_ph: 'Street, town, district',
    owner_note: 'Your salon\'s name, location and services are edited from the dashboard, under "My salon".',
    preferences: 'Preferences',
    preferred_area: 'Preferred area',
    preferred_area_ph: 'e.g. Rose Hill',
    change_password: 'Change password',
    new_password: 'New password',
    new_password_ph: 'Leave blank to keep current password',
    confirm_password: 'Confirm new password',
    confirm_password_ph: 'Re-enter new password',
    save: 'Save changes',
    // alerts
    could_not_use_photo: 'Could not use this photo',
    permission_needed: 'Permission needed',
    camera_msg: 'Allow camera access to take a photo.',
    library_msg: 'Allow photo library access to set a profile picture.',
    profile_photo: 'Profile photo',
    choose_source: 'Choose a source',
    take_photo: 'Take photo',
    from_gallery: 'Choose from gallery',
    cancel: 'Cancel',
    name_required: 'Name required',
    name_required_msg: 'Please enter your name.',
    pw_short: 'Password too short',
    pw_short_msg: 'Use at least 6 characters.',
    pw_mismatch: "Passwords don't match",
    pw_mismatch_msg: 'Re-enter your new password.',
    saved_pw_fail: 'Profile saved, but password unchanged',
    recent_login: 'For security, changing your password needs a recent login. Log out and back in, then try again.',
    could_not_save: 'Could not save profile',
  },
  fr: {
    title: 'Modifier le profil',
    photo_hint: 'Touchez pour changer la photo, puis appuyez sur « Enregistrer »',
    basic_info: 'Informations de base',
    name: 'Nom',
    name_ph: 'Votre nom',
    email: 'E-mail (utilisé pour se connecter)',
    phone: 'Numéro de téléphone',
    age: 'Âge',
    age_ph: 'ex. 24',
    gender: 'Genre',
    female: 'Femme',
    male: 'Homme',
    address: 'Adresse',
    address_ph: 'Rue, ville, district',
    owner_note: 'Le nom, l’adresse et les services de votre salon se modifient depuis le tableau de bord, sous « Mon salon ».',
    preferences: 'Préférences',
    preferred_area: 'Quartier préféré',
    preferred_area_ph: 'ex. Rose Hill',
    change_password: 'Changer le mot de passe',
    new_password: 'Nouveau mot de passe',
    new_password_ph: 'Laissez vide pour garder le mot de passe actuel',
    confirm_password: 'Confirmer le nouveau mot de passe',
    confirm_password_ph: 'Saisissez à nouveau le mot de passe',
    save: 'Enregistrer',
    // alerts
    could_not_use_photo: 'Impossible d’utiliser cette photo',
    permission_needed: 'Autorisation nécessaire',
    camera_msg: "Autorisez l'accès à l'appareil photo pour prendre une photo.",
    library_msg: "Autorisez l'accès à la galerie pour choisir une photo de profil.",
    profile_photo: 'Photo de profil',
    choose_source: 'Choisissez une source',
    take_photo: 'Prendre une photo',
    from_gallery: 'Choisir dans la galerie',
    cancel: 'Annuler',
    name_required: 'Nom requis',
    name_required_msg: 'Veuillez saisir votre nom.',
    pw_short: 'Mot de passe trop court',
    pw_short_msg: 'Utilisez au moins 6 caractères.',
    pw_mismatch: 'Les mots de passe ne correspondent pas',
    pw_mismatch_msg: 'Saisissez à nouveau votre nouveau mot de passe.',
    saved_pw_fail: 'Profil enregistré, mais mot de passe inchangé',
    recent_login: 'Par sécurité, changer le mot de passe nécessite une connexion récente. Déconnectez-vous, reconnectez-vous, puis réessayez.',
    could_not_save: "Impossible d'enregistrer le profil",
  },
};

// The saved value stays "Female" / "Male" in the database; only the label changes with the language
const GENDERS = [
  { value: 'Female', label: 'female' },
  { value: 'Male', label: 'male' },
];

export default function EditProfileScreen({ user, role, onSave, navigation }) {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const [photo, setPhoto] = useState(user?.photo || null); // small image saved as text
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [address, setAddress] = useState(user?.address || '');
  const [preferredArea, setPreferredArea] = useState(user?.preferredArea || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [processingPhoto, setProcessingPhoto] = useState(false);

  // Shrink the chosen photo and keep it as text
  const useChosenPhoto = async (result) => {
    if (result.canceled) return;
    setProcessingPhoto(true);
    try {
      const small = await toSmallImageText(result.assets[0].uri, 300, 0.5);
      setPhoto(small);
    } catch (e) {
      console.log('Photo error', e);
      Alert.alert(L.could_not_use_photo, e.message);
    }
    setProcessingPhoto(false);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(L.permission_needed, L.camera_msg);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    await useChosenPhoto(result);
  };

  const chooseFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(L.permission_needed, L.library_msg);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    await useChosenPhoto(result);
  };

  const pickPhoto = () => {
    Alert.alert(L.profile_photo, L.choose_source, [
      { text: L.take_photo, onPress: takePhoto },
      { text: L.from_gallery, onPress: chooseFromLibrary },
      { text: L.cancel, style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(L.name_required, L.name_required_msg);
      return;
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        Alert.alert(L.pw_short, L.pw_short_msg);
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert(L.pw_mismatch, L.pw_mismatch_msg);
        return;
      }
    }

    const profileData = {
      name: name.trim(),
      phone: phone.trim(),
      age: age.trim(),
      gender,
      address: address.trim(),
      photo,
      ...(role === 'owner' ? {} : { preferredArea: preferredArea.trim() }),
    };

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), profileData);

      // Owners: also copy the photo to the salon record, because customers can read
      // salons but not other people's user profiles.
      if (role === 'owner') {
        try {
          await updateDoc(doc(db, 'salons', auth.currentUser.uid), { photo: photo || null });
        } catch (e) {
          // The salon may not exist yet (created later in "My salon"). That is fine.
          console.log('Salon photo not copied:', e.code || e.message);
        }
      }

      if (newPassword) {
        try {
          await updatePassword(auth.currentUser, newPassword);
        } catch (e) {
          Alert.alert(
            L.saved_pw_fail,
            e.code === 'auth/requires-recent-login' ? L.recent_login : e.message
          );
          onSave?.({ ...user, ...profileData });
          navigation.goBack();
          return;
        }
      }

      // Merge so fields we don't edit here (email, role) are kept in the app's state
      onSave?.({ ...user, ...profileData });
      navigation.goBack();
    } catch (e) {
      Alert.alert(L.could_not_save, e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardScreen>
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#2C3E50" />
        </TouchableOpacity>

        <Text style={styles.title}>{L.title}</Text>

        <TouchableOpacity style={styles.photoWrap} onPress={pickPhoto} disabled={processingPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={32} color="#C9C7C0" />
            </View>
          )}
          <View style={styles.photoBadge}>
            {processingPhoto ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={14} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>{L.photo_hint}</Text>

        <Text style={styles.sectionLabel}>{L.basic_info}</Text>
        <Text style={styles.label}>{L.name}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={L.name_ph} />

        <Text style={styles.label}>{L.email}</Text>
        <TextInput style={[styles.input, styles.readOnly]} value={user?.email || auth.currentUser?.email || ''} editable={false} />

        <Text style={styles.label}>{L.phone}</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+230 5xxx xxxx"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>{L.age}</Text>
        <TextInput
          style={styles.input}
          value={age}
          onChangeText={setAge}
          placeholder={L.age_ph}
          keyboardType="number-pad"
          maxLength={3}
        />

        <Text style={styles.label}>{L.gender}</Text>
        <View style={styles.chipRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.chip, gender === g.value && styles.chipActive]}
              onPress={() => setGender(g.value)}
            >
              <Text style={[styles.chipText, gender === g.value && styles.chipTextActive]}>{L[g.label]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{L.address}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={address}
          onChangeText={setAddress}
          placeholder={L.address_ph}
          multiline
        />

        {role === 'owner' ? (
          <Text style={styles.ownerNote}>{L.owner_note}</Text>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{L.preferences}</Text>
            <Text style={styles.label}>{L.preferred_area}</Text>
            <TextInput
              style={styles.input}
              value={preferredArea}
              onChangeText={setPreferredArea}
              placeholder={L.preferred_area_ph}
            />
          </>
        )}

        <Text style={styles.sectionLabel}>{L.change_password}</Text>
        <Text style={styles.label}>{L.new_password}</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={L.new_password_ph}
          secureTextEntry
        />
        <Text style={styles.label}>{L.confirm_password}</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={L.confirm_password_ph}
          secureTextEntry
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || processingPhoto}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>{L.save}</Text>}
        </TouchableOpacity>
      </KeyboardScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 20, paddingTop: 60 },
  back: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C3E50', marginBottom: 20 },
  photoWrap: { alignSelf: 'center', marginBottom: 6 },
  photo: { width: 88, height: 88, borderRadius: 44 },
  photoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F4F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D85A30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoHint: { textAlign: 'center', color: '#888780', fontSize: 12, marginBottom: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#D85A30', marginTop: 10, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: '#888780', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
    fontSize: 16,
  },
  readOnly: { backgroundColor: '#F4F3EF', color: '#888780' },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  ownerNote: {
    fontSize: 13,
    color: '#888780',
    backgroundColor: '#F4F3EF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 18, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  chipActive: { backgroundColor: '#D85A30', borderColor: '#D85A30' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveButton: {
    backgroundColor: '#D85A30',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});