import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Shrinks a photo and returns it as text ("data:image/jpeg;base64,...")
// so it can be saved inside a Firestore document.
export async function toSmallImageText(uri, width = 300, compress = 0.5) {
  const context = ImageManipulator.manipulate(uri);
  context.resize({ width });
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress, format: SaveFormat.JPEG, base64: true });
  return `data:image/jpeg;base64,${result.base64}`;
}