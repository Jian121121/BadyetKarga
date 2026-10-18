import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { useAppDimensions } from '../utils/appDimensions';
import { colors, typography, spacing, radii } from '../theme';
import { useDialogStore } from '../../store/dialogStore';
import GlassView from './GlassView';

/**
 * Compact centered dialog used by confirmAction / notify across web + native.
 * Keep it small so it never fills the screen.
 */
export default function AppDialog() {
  const current = useDialogStore((s) => s.current);
  const settle = useDialogStore((s) => s.settle);
  const { width: windowWidth } = useAppDimensions();
  const cardWidth = Math.min(windowWidth - 48, 340);

  if (!current) return null;

  const isConfirm = current.mode === 'confirm';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => settle(false)}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => settle(false)} />
        <GlassView style={[styles.card, { width: cardWidth }]} accessibilityRole="alert">
          <Text style={styles.title}>{current.title}</Text>
          {!!current.message && <Text style={styles.message}>{current.message}</Text>}

          <View style={styles.actions}>
            {isConfirm && (
              <>
                {current.secondaryLabel ? (
                  <Pressable
                    style={[styles.btn, styles.btnGhost, styles.secondaryBtn]}
                    onPress={() => settle('secondary')}
                    hitSlop={6}
                  >
                    <Text style={styles.btnGhostText}>{current.secondaryLabel}</Text>
                  </Pressable>
                ) : null}
                {current.cancelLabel ? (
                  <Pressable
                    style={[styles.btn, styles.btnGhost]}
                    onPress={() => settle(false)}
                    hitSlop={6}
                  >
                    <Text style={styles.btnGhostText}>{current.cancelLabel}</Text>
                  </Pressable>
                ) : null}
              </>
            )}
            <Pressable
              style={[
                styles.btn,
                styles.btnPrimary,
                current.destructive && styles.btnDanger,
                !isConfirm && styles.btnSingle,
              ]}
              onPress={() => settle(true)}
              hitSlop={6}
            >
              <Text style={styles.btnPrimaryText}>{current.confirmLabel}</Text>
            </Pressable>
          </View>
        </GlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(25, 28, 27, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    maxWidth: 340,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    // Soft lift without stacking huge shadows
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    ...typography.titleLg,
    fontSize: 18,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  btn: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSingle: {
    minWidth: 88,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  secondaryBtn: {
    marginRight: 'auto',
  },
  btnGhostText: {
    ...typography.labelLg,
    color: colors.onSurfaceVariant,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
  },
  btnDanger: {
    backgroundColor: colors.error,
  },
  btnPrimaryText: {
    ...typography.labelLg,
    color: colors.onPrimary,
  },
});
