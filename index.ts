import { registerRootComponent } from 'expo';
import './src/services/notificationScheduler';
import { installPhoneFrame } from './src/shared/web/installPhoneFrame';

import App from './App';

installPhoneFrame();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
