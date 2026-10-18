import { Platform, useWindowDimensions } from 'react-native';

/** Wide browser windows show the app in a centered phone-width column. */
export const WEB_FRAME_MIN_VIEWPORT = 600;
export const WEB_FRAME_WIDTH = 430;

/** Window size, with width capped to the phone frame on wide web screens. */
export function useAppDimensions() {
  const dims = useWindowDimensions();
  if (Platform.OS !== 'web' || dims.width < WEB_FRAME_MIN_VIEWPORT) return dims;
  return { ...dims, width: WEB_FRAME_WIDTH };
}
