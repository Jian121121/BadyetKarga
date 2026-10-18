import { View, Text, Pressable, StyleSheet, Platform, Keyboard } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState, type ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import GlassView from '../../shared/components/GlassView';
import FadeIn from '../../shared/motion/FadeIn';
import { colors, typography, spacing, radii } from '../../shared/theme';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

const TAB_META: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  HomeTab: { label: 'Home', icon: 'home', iconActive: 'home' },
  PlannerTab: { label: 'Planner', icon: 'event', iconActive: 'calendar-month' },
  GroceriesTab: { label: 'Groceries', icon: 'shopping-cart', iconActive: 'shopping-cart' },
  AnalyticsTab: { label: 'Analytics', icon: 'bar-chart', iconActive: 'insights' },
  ProfileTab: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'web' ? 10 : 8);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <FadeIn>
      <GlassView style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const meta = TAB_META[route.name] ?? {
            label: options.title ?? route.name,
            icon: 'circle' as IconName,
            iconActive: 'circle' as IconName,
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? meta.label}
              onPress={onPress}
              style={styles.item}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive, focused && styles.iconWrapPop]}>
                <MaterialIcons
                  name={focused ? meta.iconActive : meta.icon}
                  size={22}
                  color={focused ? colors.primary : colors.onSurfaceVariant}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </GlassView>
      </FadeIn>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.xl,
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minHeight: 52,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: radii.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(120,190,32,0.18)',
  },
  iconWrapPop: {
    transform: [{ scale: 1.06 }],
  },
  label: {
    ...typography.labelLg,
    fontSize: 10,
    color: colors.onSurfaceVariant,
  },
  labelActive: {
    color: colors.primary,
  },
});
