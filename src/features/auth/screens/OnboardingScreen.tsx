import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  useWindowDimensions,
  type ViewToken,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing } from '../../../shared/theme';
import { markOnboardingSeen } from '../../../services/onboardingService';
import BrandLogo from '../../../shared/components/BrandLogo';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

type Slide = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  image: number;
};

const SLIDES: Slide[] = [
  {
    key: 'plan',
    eyebrow: 'Meal planning',
    title: 'Plan meals\nsmarter.',
    body: 'Map out the week in one place so every breakfast, lunch, and dinner stays simple for the whole household.',
    accent: '#2e7d32',
    image: require('../../../../assets/onboarding/plan-meals.png'),
  },
  {
    key: 'budget',
    eyebrow: 'Smart groceries',
    title: 'Stay under\nbudget.',
    body: 'Turn your meal plan into a grocery list with live cost tracking — so you know what you can afford before you shop.',
    accent: '#feb300',
    image: require('../../../../assets/onboarding/optimize-budget.png'),
  },
  {
    key: 'waste',
    eyebrow: 'Less waste',
    title: 'Cook what\nyou already have.',
    body: 'Keep a living pantry, skip duplicate buys, and put leftover ingredients to work instead of throwing them out.',
    accent: '#0d631b',
    image: require('../../../../assets/onboarding/reduce-waste.png'),
  },
];

const NATIVE_DRIVER = Platform.OS !== 'web';

export default function OnboardingScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const compact = height < 720;
  const heroHeight = Math.min(height * (compact ? 0.32 : 0.42), 400);

  useEffect(() => {
    fade.setValue(0.35);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 240, useNativeDriver: NATIVE_DRIVER }),
      ...dotAnims.map((anim, i) =>
        Animated.timing(anim, {
          toValue: i === index ? 1 : 0,
          duration: 220,
          useNativeDriver: false, // width/color can't use the native driver
        })
      ),
    ]).start();
  }, [index]);

  const finish = async () => {
    await markOnboardingSeen();
    navigation.replace('Login');
  };

  const goNext = () => {
    if (index >= SLIDES.length - 1) {
      void finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;
  const eyebrowColor = slide.accent === '#feb300' ? colors.secondary : colors.primary;

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={[styles.blobPrimary, { backgroundColor: slide.accent }]} />
      <View style={styles.blobSecondary} />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <BrandLogo size={30} />
        <Pressable onPress={() => void finish()} hitSlop={12} style={styles.skipHit}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={{ height: heroHeight + spacing.sm }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <View style={[styles.heroStage, { height: heroHeight }]}>
              <Image source={item.image} style={styles.heroImage} resizeMode="contain" />
            </View>
          </View>
        )}
      />

      <ScrollView style={styles.copyScroll} bounces={false} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[styles.copyBlock, compact && styles.copyBlockCompact, { opacity: fade }]}
        >
          <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{slide.eyebrow}</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => {
            const widthAnim = dotAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [8, 28],
            });
            const colorAnim = dotAnims[i].interpolate({
              inputRange: [0, 1],
              outputRange: [colors.outlineVariant, colors.primary],
            });
            return (
              <Animated.View
                key={s.key}
                style={[styles.dot, { width: widthAnim, backgroundColor: colorAnim }]}
              />
            );
          })}
        </View>

        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={goNext}
        >
          <Text style={styles.ctaLabel}>{isLast ? 'Get Started' : 'Next'}</Text>
          <MaterialIcons name="arrow-forward" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f3f7f2',
    overflow: 'hidden',
  },
  blobPrimary: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    top: -80,
    right: -90,
    opacity: 0.16,
  },
  blobSecondary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    bottom: 120,
    left: -100,
    backgroundColor: colors.secondaryContainer,
    opacity: 0.2,
  },
  topBar: {
    paddingHorizontal: spacing.marginMobile,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  skipHit: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skip: {
    ...typography.titleMd,
    color: colors.primary,
  },
  heroStage: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.marginMobile,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  copyScroll: {
    flex: 1,
  },
  copyBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  copyBlockCompact: {
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  eyebrow: {
    ...typography.labelLg,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    ...typography.headlineLg,
    fontSize: 34,
    lineHeight: 40,
    color: colors.onSurface,
  },
  titleCompact: {
    fontSize: 28,
    lineHeight: 34,
  },
  body: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    maxWidth: 360,
  },
  footer: {
    paddingHorizontal: spacing.marginMobile,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  cta: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaLabel: {
    ...typography.titleMd,
    color: colors.onPrimary,
  },
});
