import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import s from '../../styles';
import { toSmallImageText } from '../../utils/imageUtils';

const MAX_PHOTOS = 8;

// English and French texts of this screen
const TEXTS = {
  en: {
    title: 'Portfolio photos',
    subtitle: (n, max) => `Add photos of your work for customers to browse (${n}/${max})`,
    take_photo: 'Take photo',
    gallery: 'Gallery',
    empty: 'No photos yet — add a few to show off your work',
    full_title: 'Portfolio is full',
    full_msg: (max) => `You can keep up to ${max} photos. Remove one to add another.`,
    create_salon_first: 'Create your salon first',
    create_salon_first_msg: 'Go to "My salon" on the dashboard and save your salon details.',
    could_not_save: 'Could not save photo',
    permission_needed: 'Permission needed',
    camera_msg: 'Camera access is needed to take a portfolio photo.',
    gallery_msg: 'Gallery access is needed to choose a portfolio photo.',
    remove_title: 'Remove photo',
    remove_msg: 'Remove this photo from your portfolio?',
    cancel: 'Cancel',
    remove: 'Remove',
  },
  fr: {
    title: 'Photos du portfolio',
    subtitle: (n, max) => `Ajoutez des photos de votre travail pour que les clients les découvrent (${n}/${max})`,
    take_photo: 'Prendre une photo',
    gallery: 'Galerie',
    empty: 'Aucune photo — ajoutez-en quelques-unes pour montrer votre travail',
    full_title: 'Portfolio complet',
    full_msg: (max) => `Vous pouvez garder jusqu'à ${max} photos. Supprimez-en une pour en ajouter une autre.`,
    create_salon_first: "Créez d'abord votre salon",
    create_salon_first_msg: 'Allez dans « Mon salon » sur le tableau de bord et enregistrez les détails de votre salon.',
    could_not_save: "Impossible d'enregistrer la photo",
    permission_needed: 'Autorisation nécessaire',
    camera_msg: "L'accès à l'appareil photo est nécessaire pour prendre une photo du portfolio.",
    gallery_msg: "L'accès à la galerie est nécessaire pour choisir une photo du portfolio.",
    remove_title: 'Supprimer la photo',
    remove_msg: 'Supprimer cette photo de votre portfolio ?',
    cancel: 'Annuler',
    remove: 'Supprimer',
  },
};

export default function PortfolioUploadScreen() {
  const { i18n } = useTranslation();
  const L = TEXTS[(i18n.language || 'en').startsWith('fr') ? 'fr' : 'en'];

  const uid = auth.currentUser?.uid;
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);

  // My portfolio photos, live from Firestore (newest first)
  useEffect(() => {
    const q = query(collection(db, 'portfolio'), where('salonId', '==', uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const time = (p) => p.createdAt?.toMillis?.() ?? Number.MAX_SAFE_INTEGER;
        list.sort((a, b) => time(b) - time(a));
        setPhotos(list);
      },
      (err) => console.log('Portfolio error', err)
    );
    return unsub;
  }, [uid]);

  const savePhoto = async (result) => {
    if (result.canceled || !result.assets?.length) return;

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(L.full_title, L.full_msg(MAX_PHOTOS));
      return;
    }

    setSaving(true);
    try {
      // A portfolio belongs to a salon, so the salon must exist first
      const salonSnap = await getDoc(doc(db, 'salons', uid));
      if (!salonSnap.exists()) {
        Alert.alert(L.create_salon_first, L.create_salon_first_msg);
        setSaving(false);
        return;
      }

      const image = await toSmallImageText(result.assets[0].uri, 600, 0.5);
      await addDoc(collection(db, 'portfolio'), {
        salonId: uid,
        ownerId: uid,
        image,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.log('Save photo error', e);
      Alert.alert(L.could_not_save, e.message);
    }
    setSaving(false);
  };

  const pickImage = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert(L.permission_needed, fromCamera ? L.camera_msg : L.gallery_msg);
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });

    await savePhoto(result);
  };

  const removePhoto = (id) => {
    Alert.alert(L.remove_title, L.remove_msg, [
      { text: L.cancel, style: 'cancel' },
      {
        text: L.remove,
        style: 'destructive',
        onPress: () => deleteDoc(doc(db, 'portfolio', id)).catch((e) => console.log('Delete error', e)),
      },
    ]);
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>{L.title}</Text>
      <Text style={s.subtitle}>{L.subtitle(photos.length, MAX_PHOTOS)}</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => pickImage(true)} disabled={saving}>
          <Ionicons name="camera-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionText}>{L.take_photo}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#534AB7' }]}
          onPress={() => pickImage(false)}
          disabled={saving}
        >
          <Ionicons name="images-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionText}>{L.gallery}</Text>
        </TouchableOpacity>
      </View>

      {saving && <ActivityIndicator style={{ marginBottom: 12 }} />}

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.photoWrap} onPress={() => removePhoto(item.id)}>
            <Image source={{ uri: item.image }} style={styles.photo} />
            <View style={styles.removeBadge}>
              <Ionicons name="close" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={32} color="#B9B6AE" />
            <Text style={styles.emptyText}>{L.empty}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D85A30',
    borderRadius: 10,
    paddingVertical: 12,
  },
  actionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  photoWrap: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#888780',
    textAlign: 'center',
    marginTop: 10,
  },
});