import { Platform } from 'react-native';
import { WEB_FRAME_MIN_VIEWPORT, WEB_FRAME_WIDTH } from '../utils/appDimensions';

/**
 * On wide browser windows, narrows <body> to a phone-width column.
 * `transform` makes <body> the containing block for fixed-position modals, so sheets stay inside the frame.
 */
export function installPhoneFrame() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
@media (min-width: ${WEB_FRAME_MIN_VIEWPORT}px) {
  html { background: #cfd8c8; }
  body {
    max-width: ${WEB_FRAME_WIDTH}px;
    margin: 0 auto;
    background: #ffffff;
    overflow: hidden;
    transform: translateZ(0);
    box-shadow: 0 0 0 1px rgba(32, 37, 29, 0.08), 0 24px 60px rgba(32, 37, 29, 0.18);
  }
}`;
  document.head.appendChild(style);
}
