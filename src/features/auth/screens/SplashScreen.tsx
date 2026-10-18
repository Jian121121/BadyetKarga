import { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import FadeIn from '../../../shared/motion/FadeIn';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { hasSeenOnboarding } from '../../../services/onboardingService';
import BrandLogo from '../../../shared/components/BrandLogo';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const logoWidth = Math.round(Math.min(width * 0.72, height * 0.38, 340));

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
      <FadeIn style={styles.center}>
        <BrandLogo variant="full" size={logoWidth} />
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  center: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
