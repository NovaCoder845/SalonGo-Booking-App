import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../firebaseConfig';

const GENDERS = ['Female', 'Male'];

export default function EditProfileScreen({ user, role, onSave, navigation }) {
  const [photo, setPhoto] = useState(user?.photo || null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || '');
  const [address, setAddress] = useState(user?.address || '');
  const [salonName, setSalonName] = useState(user?.salonName || '');
  const [salonArea, setSalonArea] = useState(user?.salonArea || '');
  const [preferredArea, setPreferredArea] = useState(user?.preferredArea || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const chooseFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const pickPhoto = () => {
    Alert.alert('Profile photo', 'Choose a source', [
      { text: 'Take photo', onPress: takePhoto },
      { text: 'Choose from gallery', onPress: chooseFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        Alert.alert('Password too short', 'Use at least 6 characters.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Passwords don't match", 'Re-enter your new password.');
        return;
      }
    }

    const profileData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      age: age.trim(),
      gender,
      address: address.trim(),
      photo,
      ...(role === 'owner'
        ? { salonName: salonName.trim(), salonArea: salonArea.trim() }
        : { preferredArea: preferredArea.trim() }),
    };

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), profileData);

      if (newPassword) {
        try {
          await updatePassword(auth.currentUser, newPassword);
        } catch (e) {
          Alert.alert(
            'Profile saved, but password unchanged',
            e.code === 'auth/requires-recent-login'
              ? 'For security, changing your password needs a recent login. Log out and back in, then try again.'
              : e.message
          );
          navigation.goBack();
          return;
        }
      }

      onSave?.(profileData);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save profile', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 60 }}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="#2C3E50" />
      </TouchableOpacity>

      <Text style={styles.title}>Edit profile</Text>

      <TouchableOpacity style={styles.photoWrap} onPress={pickPhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={32} color="#C9C7C0" />
          </View>
        )}
        <View style={styles.photoBadge}>
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
      </TouchableOpacity>
      <Text style={styles.photoHint}>Tap to change photo</Text>

      <Text style={styles.sectionLabel}>Basic info</Text>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="+230 5xxx xxxx"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Age</Text>
      <TextInput
        style={styles.input}
        value={age}
        onChangeText={setAge}
        placeholder="e.g. 24"
        keyboardType="number-pad"
        maxLength={3}
      />

      <Text style={styles.label}>Gender</Text>
      <View style={styles.chipRow}>
        {GENDERS.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.chip, gender === g && styles.chipActive]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={address}
        onChangeText={setAddress}
        placeholder="Street, town, district"
        multiline
      />

      {role === 'owner' ? (
        <>
          <Text style={styles.sectionLabel}>Salon details</Text>
          <Text style={styles.label}>Salon name</Text>
          <TextInput style={styles.input} value={salonName} onChangeText={setSalonName} placeholder="e.g. Belle Hair Studio" />

          <Text style={styles.label}>Salon area</Text>
          <TextInput style={styles.input} value={salonArea} onChangeText={setSalonArea} placeholder="e.g. Curepipe" />
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Preferences</Text>
          <Text style={styles.label}>Preferred area</Text>
          <TextInput
            style={styles.input}
            value={preferredArea}
            onChangeText={setPreferredArea}
            placeholder="e.g. Rose Hill"
          />
        </>
      )}

      <Text style={styles.sectionLabel}>Change password</Text>
      <Text style={styles.label}>New password</Text>
      <TextInput
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Leave blank to keep current password"
        secureTextEntry
      />
      <Text style={styles.label}>Confirm new password</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Re-enter new password"
        secureTextEntry
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save changes</Text>}
      </TouchableOpacity>
    </ScrollView>
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
  multiline: { minHeight: 70, textAlignVertical: 'top' },
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