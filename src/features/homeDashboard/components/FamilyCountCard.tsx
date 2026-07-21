import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '../../../shared/theme';

interface FamilyCountCardProps {
  count: number;
}

export default function FamilyCountCard({ count }: FamilyCountCardProps) {
  return (
    <View style={styles.card}>
      <MaterialIcons name="group" size={36} color={colors.onTertiaryContainer} />
      <Text style={styles.count}>{count}</Text>
      <Text style={styles.label}>Family Members</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: { ...typography.displayLg, color: colors.onTertiaryContainer, marginTop: 4 },
  label: { ...typography.labelLg, color: colors.onTertiaryContainer, marginTop: 4, textTransform: 'uppercase' },
});