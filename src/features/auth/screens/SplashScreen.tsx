import { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import FadeIn from '../../../shared/motion/FadeIn';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { hasSeenOnboarding } from '../../../services/onboardingService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const seen = await hasSeenOnboarding();
      if (cancelled) return;
      navigation.replace(seen ? 'Login' : 'Onboarding');
    }, 1600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      <FadeIn>
        <Image
          source={require('../../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="BadyetKarga"
        />
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 48,
  },
  logo: {
    width: '100%',
    maxWidth: 280,
    height: 280,
  },
});
