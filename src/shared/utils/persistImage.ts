import type { ImagePickerAsset } from 'expo-image-picker';

/**
 * ImagePicker cache URIs can disappear after app restarts.
 * Prefer a durable data URI when base64 is available.
 */
export function durableImageUri(asset: ImagePickerAsset): string {
  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri;
}

export const IMAGE_PICKER_OPTS = {
  mediaTypes: ['images'] as ['images'],
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  quality: 0.7,
  base64: true,
};
