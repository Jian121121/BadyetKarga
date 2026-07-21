import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../../shared/theme';

export default function HomeHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <Pressable style={styles.iconButton}>
          <MaterialIcons name="menu" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.title}>BadyetKarga</Text>
      </View>
      <View style={styles.right}>
        <Pressable style={styles.iconButton}>
          <MaterialIcons name="notifications" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
        <Image
          style={styles.avatar}
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRbv6mpeONiEzd3rghzNZs7voAErbBpkquiHbpfOlIiS729-P4C_1Ol6vg_SNfRkejPQZr8xDXFBsIo8qvgXiY5qo7rp-dBCt002Cxp_wqQzyU8DoE9P8U1-0KO8cJihAeb9-0VOzXhZ6qHC5VEVycrv7nS93dQHBsXJWlm135MSsp5-x4TuxBtdjV6Pwa0o5ss4DlC-ZVP4ewR-JrEXpgMJcKgt0vIx_KvCBuRXtZssrSfSMVFA4ldA',
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: spacing.marginMobile,
    backgroundColor: colors.surface,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: 999,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.primary,
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryContainer,
  },
});