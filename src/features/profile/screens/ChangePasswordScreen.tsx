import { useState } from 'react';
import { Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../../app/navigation/types';
import { colors, typography, spacing, radii } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextInput from '../../../shared/components/TextInput';
import { useAuthStore } from '../../../store/authStore';
import { confirmAction, notify } from '../../../shared/utils/confirm';
import { useDialogStore } from '../../../store/dialogStore';
import BackHeader from '../../../shared/components/BackHeader';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const changePassword = useAuthStore((s) => s.changePassword);
  const isGoogle = currentUser?.authProvider === 'google';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPassword.length < 6) {
      notify('Too short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      notify('Mismatch', 'New passwords do not match.');
      return;
    }
    if (!isGoogle && !currentPassword) {
      notify('Required', 'Enter your current password.');
      return;
    }
    confirmAction(
      'Update password?',
      'Your current password will stop working after this change.',
      'Update',
      () => {
        void (async () => {
          setSaving(true);
          try {
            await changePassword(currentPassword, newPassword);
            const result = await useDialogStore.getState().openConfirm({
              title: 'Password Changed',
              message:
                'Your password has been updated. Would you like to stay signed in, or log in again with your new password?',
              confirmLabel: 'Stay Signed In',
              cancelLabel: '',
              secondaryLabel: 'Log In Again',
            });

            if (result === 'secondary') {
              await useAuthStore.getState().logout();
            }
          } catch (err) {
            notify('Could not update', err instanceof Error ? err.message : 'Try again.');
          } finally {
            setSaving(false);
          }
        })();
      }
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BackHeader title="Change Password" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isGoogle ? (
          <Text style={styles.hint}>
            You signed in with Google. You can optionally set a local password so you can also log
            in with email.
          </Text>
        ) : (
          <TextInput
            label="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
        )}
        <TextInput
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />
        <TextInput
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
        />
        <Button label="Update Password" onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.marginMobile, gap: spacing.xs },
  hint: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
});
