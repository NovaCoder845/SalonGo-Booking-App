import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import s from '../../styles';

// Later: upload the picked image to Firebase Storage and save its URL
// in this salon's "portfolio" array/subcollection in Firestore.
export default function PortfolioUploadScreen() {
  const [photos, setPhotos] = useState([]);

  const pickImage = async (fromCamera) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', fromCamera
        ? 'Camera access is needed to take a portfolio photo.'
        : 'Gallery access is needed to choose a portfolio photo.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setPhotos((prev) => [{ id: String(Date.now()), uri }, ...prev]);
    }
  };

  const removePhoto = (id) => {
    Alert.alert('Remove photo', 'Remove this photo from your portfolio?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setPhotos((prev) => prev.filter((p) => p.id !== id)) },
    ]);
  };

  return (
    <View style={s.screen}>
      <Text style={s.title}>Portfolio photos</Text>
      <Text style={s.subtitle}>Add photos of your work for customers to browse</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => pickImage(true)}>
          <Ionicons name="camera-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionText}>Take photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#534AB7' }]} onPress={() => pickImage(false)}>
          <Ionicons name="images-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.actionText}>Gallery</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.photoWrap} onPress={() => removePhoto(item.id)}>
            <Image source={{ uri: item.uri }} style={styles.photo} />
            <View style={styles.removeBadge}>
              <Ionicons name="close" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={32} color="#B9B6AE" />
            <Text style={styles.emptyText}>No photos yet — add a few to show off your work</Text>
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
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
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