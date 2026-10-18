import { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassView from './GlassView';
import { colors, typography, spacing, radii } from '../theme';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatRelativeTime, type AppNotification, type NotificationCategory } from '../utils/notifications';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const CATEGORY_TINT: Record<NotificationCategory, string> = {
  meals: colors.primary,
  groceries: colors.secondary,
  budget: colors.tertiary,
  system: colors.onSurfaceVariant,
};

function NotificationRow({ item, unread }: { item: AppNotification; unread: boolean }) {
  const tint = CATEGORY_TINT[item.category];
  return (
    <View style={[styles.row, unread && styles.rowUnread]}>
      <View style={[styles.iconCircle, { backgroundColor: `${tint}1f` }]}>
        <MaterialIcons name={item.icon} size={20} color={tint} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, unread && styles.rowTitleUnread]}>{item.title}</Text>
        <Text style={styles.rowText}>{item.body}</Text>
        <Text style={styles.timeText}>{formatRelativeTime(item.timestamp)}</Text>
      </View>
      {unread && <View style={styles.unreadDot} />}
    </View>
  );
}

export default function NotificationsModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((s) => s.currentUser);
  const items = useNotificationStore((s) => s.items);
  const readIds = useNotificationStore((s) => s.readIds);
  const prefs = useNotificationStore((s) => s.prefs);
  const refresh = useNotificationStore((s) => s.refresh);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    if (visible && currentUser) {
      void refresh(currentUser.id);
    }
  }, [visible, currentUser?.id]);

  const unreadItems = items.filter((n) => !readIds.includes(n.id));
  const earlierItems = items.filter((n) => readIds.includes(n.id));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingBottom: spacing.marginMobile + insets.bottom }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GlassView style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>
                {unreadItems.length > 0
                  ? `${unreadItems.length} new update${unreadItems.length === 1 ? '' : 's'} for your household.`
                  : 'Meal, grocery, and budget updates for your household.'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {!prefs.master ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
                <MaterialIcons name="notifications-off" size={28} color={colors.onSurfaceVariant} />
              </View>
              <Text style={styles.emptyTitle}>Notifications are off</Text>
              <Text style={styles.emptyBody}>
                Turn them on in Profile → Preferences to see meal, grocery, and budget alerts.
              </Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryContainer }]}>
                <MaterialIcons name="check-circle" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>You're all caught up</Text>
              <Text style={styles.emptyBody}>
                New alerts show up here as your meals, groceries, and budget change.
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={styles.list}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {unreadItems.length > 0 && (
                <>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionHeader}>NEW</Text>
                    <Pressable onPress={() => currentUser && void markAllRead(currentUser.id)} hitSlop={10}>
                      <Text style={styles.markReadText}>Mark all read</Text>
                    </Pressable>
                  </View>
                  {unreadItems.map((n) => (
                    <NotificationRow key={n.id} item={n} unread />
                  ))}
                </>
              )}

              {earlierItems.length > 0 && (
                <>
                  <View style={styles.sectionRow}>
                    <Text style={styles.sectionHeader}>EARLIER</Text>
                  </View>
                  {earlierItems.map((n) => (
                    <NotificationRow key={n.id} item={n} unread={false} />
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </GlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.marginMobile,
  },
  sheet: {
    borderRadius: radii.xl,
    padding: spacing.marginMobile,
    gap: spacing.xs,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.outlineVariant,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerCopy: { flex: 1 },
  title: { ...typography.titleLg, color: colors.onSurface },
  subtitle: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: { paddingBottom: spacing.xs },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionHeader: {
    ...typography.labelLg,
    fontSize: 11,
    letterSpacing: 0.8,
    color: colors.onSurfaceVariant,
  },
  markReadText: { ...typography.labelLg, fontSize: 12, color: colors.primary },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: 2,
  },
  rowUnread: { backgroundColor: colors.primaryContainer },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowBody: { flex: 1 },
  rowTitle: { ...typography.bodyLg, fontSize: 15, lineHeight: 20, color: colors.onSurface },
  rowTitleUnread: { ...typography.titleMd, fontSize: 15, lineHeight: 20 },
  rowText: { ...typography.bodyMd, fontSize: 13, lineHeight: 18, color: colors.onSurface, opacity: 0.75, marginTop: 2 },
  timeText: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: { ...typography.titleMd, color: colors.onSurface },
  emptyBody: { ...typography.bodyMd, fontSize: 13, color: colors.onSurfaceVariant, textAlign: 'center' },
});
