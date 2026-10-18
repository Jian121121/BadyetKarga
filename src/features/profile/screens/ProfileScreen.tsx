import { useEffect, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Switch,
  Image,
  Alert,
  useWindowDimensions,
} from 'react-native';
import BrandLogo from '../../../shared/components/BrandLogo';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import { useAuthStore } from '../../../store/authStore';
import { useHouseholdStore } from '../../../store/householdStore';
import { useFamilyStore } from '../../../store/familyStore';
import { useNotificationStore } from '../../../store/notificationStore';
import { durableImageUri, IMAGE_PICKER_OPTS } from '../../../shared/utils/persistImage';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import FadeIn from '../../../shared/motion/FadeIn';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

function initials(name?: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export default function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const dialogWidth = Math.min(windowWidth - 48, 400);
  const { currentUser, logout, updateAvatar } = useAuthStore();
  const settings = useHouseholdStore((s) => s.settings);
  const members = useFamilyStore((s) => s.members);
  const loadMembers = useFamilyStore((s) => s.loadMembers);

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [photoSheet, setPhotoSheet] = useState(false);

  const notifPrefs = useNotificationStore((s) => s.prefs);
  const loadNotifPrefs = useNotificationStore((s) => s.loadPrefs);
  const setNotifMaster = useNotificationStore((s) => s.setMaster);
  const setNotifCategory = useNotificationStore((s) => s.setCategory);
  const notificationsOn = notifPrefs.master;

  useEffect(() => {
    if (currentUser) {
      void loadMembers(currentUser.id);
      void loadNotifPrefs(currentUser.id);
    }
  }, [currentUser?.id]);

  const toggleNotifications = async (value: boolean) => {
    if (currentUser) await setNotifMaster(currentUser.id, value);
  };

  const toggleCategory = async (
    category: 'meals' | 'groceries' | 'budget',
    value: boolean
  ) => {
    if (currentUser) await setNotifCategory(currentUser.id, category, value);
  };

  const confirmLogout = async () => {
    setLogoutVisible(false);
    await logout();
  };

  /** iOS can't present a picker/dialog while another Modal is still animating out. */
  const afterPhotoSheetCloses = (action: () => void) => {
    setPhotoSheet(false);
    setTimeout(action, 350);
  };

  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow photo library access to set your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTS);
    if (!result.canceled && result.assets[0]) {
      await updateAvatar(durableImageUri(result.assets[0]));
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      notify('Permission needed', 'Allow camera access to take a profile picture.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(IMAGE_PICKER_OPTS);
    if (!result.canceled && result.assets[0]) {
      await updateAvatar(durableImageUri(result.assets[0]));
    }
  };

  const removePhoto = () => {
    confirmAction(
      'Remove profile photo?',
      'Your account will use your initials instead.',
      'Remove',
      () => void updateAvatar(null),
      { destructive: true }
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topBar}>
        <View style={styles.topSide} />
        <BrandLogo size={28} style={styles.brand} />
        <View style={styles.topSide}>
          <Pressable onPress={() => navigation.navigate('EditHousehold')} hitSlop={10}>
            <MaterialIcons name="settings" size={22} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <FadeIn style={styles.fadeBlock}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {currentUser?.avatarUri ? (
              <Image source={{ uri: currentUser.avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials(currentUser?.fullName)}</Text>
            )}
          </View>
          <Pressable style={styles.editBadge} onPress={() => setPhotoSheet(true)}>
            <MaterialIcons name="photo-camera" size={14} color={colors.onPrimary} />
          </Pressable>
        </View>

        <Text style={styles.name}>{currentUser?.fullName ?? 'User'}</Text>
        <Text style={styles.role}>
          {currentUser?.authProvider === 'google'
            ? 'Signed in with Google'
            : 'Household Administrator'}
        </Text>
        <Text style={styles.email}>{currentUser?.email}</Text>

        <View style={styles.summaryRow}>
          <Pressable
            style={styles.summaryCard}
            onPress={() => navigation.navigate('EditHousehold')}
          >
            <MaterialIcons name="account-balance-wallet" size={18} color={colors.primary} />
            <Text style={styles.summaryLabelGreen}>Weekly Budget</Text>
            <Text style={styles.summaryTitle} numberOfLines={1}>
              ₱{(settings?.weeklyBudget ?? 0).toLocaleString('en-PH')}
            </Text>
            <Text style={styles.summarySub}>
              {settings?.householdName || 'Tap to edit'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.summaryCard}
            onPress={() => navigation.navigate('FamilyManagement')}
          >
            <MaterialIcons name="group" size={18} color={colors.secondary} />
            <Text style={styles.summaryLabelBrown}>Family</Text>
            <Text style={styles.summaryTitle}>
              {members.length} Member{members.length === 1 ? '' : 's'}
            </Text>
            <Text style={styles.summarySub}>Active Sync</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionBar}>PREFERENCES</Text>
        <View style={styles.prefCard}>
          <PrefRow
            icon="notifications"
            label="Notifications"
            trailing={
              <View style={[styles.notifPill, notificationsOn && styles.notifPillOn]}>
                <Text style={notificationsOn ? styles.notifTextOn : styles.notifText}>
                  {notificationsOn ? 'ALL ON' : 'OFF'}
                </Text>
              </View>
            }
            onPress={() => toggleNotifications(!notificationsOn)}
          />
          <PrefRow icon="language" label="Language" value="English (PH)" last />
        </View>

        {notificationsOn && (
          <>
            <Text style={styles.sectionBar}>NOTIFICATION TYPES</Text>
            <View style={styles.prefCard}>
              <PrefRow
                icon="restaurant"
                label="Meal reminders"
                trailing={
                  <Switch
                    value={notifPrefs.meals}
                    onValueChange={(v) => toggleCategory('meals', v)}
                    trackColor={{ true: colors.primary }}
                  />
                }
              />
              <PrefRow
                icon="shopping-cart"
                label="Grocery reminders"
                trailing={
                  <Switch
                    value={notifPrefs.groceries}
                    onValueChange={(v) => toggleCategory('groceries', v)}
                    trackColor={{ true: colors.primary }}
                  />
                }
              />
              <PrefRow
                icon="savings"
                label="Budget alerts"
                trailing={
                  <Switch
                    value={notifPrefs.budget}
                    onValueChange={(v) => toggleCategory('budget', v)}
                    trackColor={{ true: colors.primary }}
                  />
                }
                last
              />
            </View>
          </>
        )}

        <Text style={styles.sectionBar}>PRIVACY & SECURITY</Text>
        <View style={styles.prefCard}>
          <PrefRow
            icon="lock"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
          <PrefRow
            icon="shield"
            label="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            last
          />
        </View>

        <Text style={styles.sectionBar}>HOUSEHOLD</Text>
        <View style={styles.prefCard}>
          <PrefRow
            icon="group"
            label="Family Members"
            onPress={() => navigation.navigate('FamilyManagement')}
          />
          <PrefRow
            icon="event-available"
            label="Weekly Availability"
            onPress={() => navigation.navigate('WeeklyAvailability')}
          />
          <PrefRow
            icon="kitchen"
            label="Pantry"
            onPress={() => navigation.navigate('Pantry')}
            last
          />
        </View>

        <Pressable style={styles.aboutCard} onPress={() => navigation.navigate('About')}>
          <MaterialIcons name="info-outline" size={20} color={colors.primary} />
          <Text style={styles.aboutText}>About BadyetKarga</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={() => setLogoutVisible(true)}>
          <MaterialIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
        <Text style={styles.version}>Version 1.0.0</Text>
        </FadeIn>
      </ScrollView>

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.logoutModal, { width: dialogWidth }]}>
            <View style={styles.logoutIconCircle}>
              <MaterialIcons name="logout" size={24} color={colors.primary} />
            </View>
            <Text style={styles.logoutTitle}>Log out?</Text>
            <Text style={styles.logoutBody}>
              Are you sure you want to logout? You will need to sign back in to access your household
              planners and groceries.
            </Text>
            <Button
              label="Cancel"
              variant="outlined"
              onPress={() => setLogoutVisible(false)}
              style={styles.modalBtn}
            />
            <Button label="Logout" onPress={confirmLogout} style={styles.modalBtn} />
          </View>
        </View>
      </Modal>

      <Modal visible={photoSheet} transparent animationType="fade" onRequestClose={() => setPhotoSheet(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPhotoSheet(false)}>
          <View style={[styles.photoSheet, { width: dialogWidth }]} onStartShouldSetResponder={() => true}>
            <Text style={styles.photoTitle}>Profile photo</Text>
            <Pressable
              style={styles.photoOption}
              onPress={() => afterPhotoSheetCloses(() => void takePhoto())}
            >
              <MaterialIcons name="photo-camera" size={22} color={colors.primary} />
              <Text style={styles.photoOptionText}>Take photo</Text>
            </Pressable>
            <Pressable
              style={styles.photoOption}
              onPress={() => afterPhotoSheetCloses(() => void pickFromLibrary())}
            >
              <MaterialIcons name="photo-library" size={22} color={colors.primary} />
              <Text style={styles.photoOptionText}>Choose from gallery</Text>
            </Pressable>
            {currentUser?.avatarUri ? (
              <Pressable
                style={styles.photoOption}
                onPress={() => afterPhotoSheetCloses(removePhoto)}
              >
                <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                <Text style={[styles.photoOptionText, { color: colors.error }]}>Remove photo</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => setPhotoSheet(false)}>
              <Text style={styles.photoCancel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function PrefRow({
  icon,
  label,
  value,
  trailing,
  onPress,
  last,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.prefRow, !last && styles.prefRowBorder]}
      disabled={!onPress && !trailing}
    >
      <MaterialIcons name={icon} size={20} color={colors.onSurfaceVariant} />
      <Text style={styles.prefLabel}>{label}</Text>
      {trailing ?? (value ? <Text style={styles.prefValue}>{value}</Text> : null)}
      {onPress && <MaterialIcons name="chevron-right" size={20} color={colors.onSurfaceVariant} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.marginMobile,
    height: 44,
  },
  topSide: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  brand: {
    flex: 1,
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: spacing.marginMobile, alignItems: 'center' },
  fadeBlock: { alignSelf: 'stretch', alignItems: 'center' },
  avatarWrap: { marginTop: spacing.md, marginBottom: spacing.sm },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 96, height: 96 },
  avatarText: { ...typography.headlineLgMobile, color: colors.onPrimaryContainer },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  name: { ...typography.headlineLgMobile, color: colors.onSurface, textAlign: 'center' },
  role: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 },
  email: { ...typography.labelLg, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch', marginBottom: spacing.md },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: 2,
  },
  summaryLabelGreen: { ...typography.labelLg, fontSize: 11, color: colors.primary, marginTop: 4 },
  summaryLabelBrown: { ...typography.labelLg, fontSize: 11, color: colors.secondary, marginTop: 4 },
  summaryTitle: { ...typography.titleMd, fontSize: 16, color: colors.onSurface },
  summarySub: { ...typography.labelLg, color: colors.onSurfaceVariant },
  sectionBar: {
    alignSelf: 'stretch',
    ...typography.labelLg,
    fontSize: 11,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
  },
  prefCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  prefRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  prefLabel: { ...typography.bodyLg, color: colors.onSurface, flex: 1 },
  prefValue: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  notifPill: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surfaceContainerHigh,
  },
  notifPillOn: { backgroundColor: colors.secondaryContainer },
  notifText: { ...typography.labelLg, fontSize: 11, color: colors.onSurfaceVariant },
  notifTextOn: { ...typography.labelLg, fontSize: 11, color: colors.onSecondaryContainer },
  aboutCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  aboutText: { ...typography.bodyLg, color: colors.onSurface, flex: 1 },
  logoutButton: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: colors.surfaceContainerLowest,
  },
  logoutText: { ...typography.titleMd, fontSize: 16, color: colors.error },
  version: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logoutModal: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 28,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoutIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  logoutTitle: { ...typography.titleLg, color: colors.onSurface },
  logoutBody: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalBtn: { alignSelf: 'stretch' },
  photoSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  photoTitle: { ...typography.titleLg, color: colors.onSurface, marginBottom: spacing.sm },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  photoOptionText: { ...typography.bodyLg, color: colors.onSurface },
  photoCancel: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
