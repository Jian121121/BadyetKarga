import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import BrandLogo from '../../../shared/components/BrandLogo';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../../shared/theme';

interface HomeHeaderProps {
  onProfilePress?: () => void;
  onNotificationsPress?: () => void;
  unreadCount?: number;
  avatarUri?: string | null;
}

export default function HomeHeader({
  onProfilePress,
  onNotificationsPress,
  unreadCount = 0,
  avatarUri,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.side} />

      <BrandLogo size={28} style={styles.brand} />

      <View style={[styles.side, styles.sideRight]}>
        <Pressable style={styles.iconButton} hitSlop={10} onPress={onNotificationsPress}>
          <MaterialIcons name="notifications-none" size={24} color={colors.onSurfaceVariant} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
        <Pressable onPress={onProfilePress} style={styles.avatar} hitSlop={6}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
          ) : (
            <MaterialIcons name="person" size={22} color={colors.onPrimary} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  side: {
    width: 88,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  brand: {
    flex: 1,
    justifyContent: 'center',
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: 999,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: colors.onError, fontSize: 9, fontWeight: '700' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36 },
});
